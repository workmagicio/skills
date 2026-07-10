---
name: lift-test-group-schema
description: platform.lift_test_group 表的落表结构 + 手工改数据（UPDATE）时的一致性校验规则。用于安全地读写这张表的 JSON 列（geo_group / test_channel / extra_info / additional_info…），重点是 geoGroup、estimator、geo item(test·control) 这些子对象在多处重复出现时必须保持一致：两处 geoGroup（顶层 geo_group 列 vs test_channel[].geoGroup）的结构差异（control 数组 vs 对象、length 可能 number 也可能 string、manual holdout 顶层是 {status:NOT_EXIST}）、以及 geo_group ↔ test_channel[].geoGroup ↔ testGeo/controlGeo 之间哪些字段必须对齐。当用户要写/审 platform.lift_test_group 的 UPDATE（改 geo_group / test_channel / 补 geo pairing）、排查落表数据对不上（geo_group 与 test_channel 不一致、test_length/cooling_length/End date 异常）、或把前端 GeoGroup/LiftTestGeoGroup 对象和数据库对应起来时，一定使用本 skill：先按这里的一致性清单校验、再给 SQL，不要凭记忆猜结构，也不要只改一处就收工。
---

# lift_test_group 落表结构 + 改数据校验

`platform.lift_test_group` 是 Lift Test 配置主表（业务库 MySQL，走 platform-api 的 `api` 数据源，**不走 dbt/离线库**）。一条记录 = 一个 lift test group（multi-cell 拆分后每个 cell 也是一条独立记录，靠 `additional_info.relatedGroupIdList` 关联）。

这张表大量用 JSON 列，而且**同一份 geo pairing 数据会以不同形状在多个位置各存一份**。手工改数据最容易出的错，就是"只改一处、另一处没跟着改 / 形状写错"导致前后端读到互相矛盾的值。本 skill 的用途：**改这张表之前先按一致性清单核对，改完再验证。**

前端形状的权威来源：`src/types/service/campaign.ts`（`CreateLiftTestGroup` / `LiftTestGroupItem`）与 `src/pages/lift-test-v2/types/index.ts`（`GeoGroup` / `LiftTestGeoGroup` / `GeoGroupValue` / `GeoGroupEstimator` / `EstimatorChannelItem`）。逐字段表 + 三条真实样本见 [references/objects.md](references/objects.md)。

## 改数据前必读：一致性不变量

**geo pairing 在一条记录里存了多份，改动必须同时满足下面这些等式，否则前后端会分裂。**

1. **顶层 `geo_group` ≡ `test_channel[i][j].geoGroup`（同一份数据的两种形状）**
   - 相同：`id`、`test.code[]`/`test.name[]`、`control` 的地区、`method`、`country`、`estimator`、`test_length`、`cooling_length`。
   - **形状差异（不是不一致，是规定）**：顶层 `control` 是**数组** `[{…}]`；channel 里 `control` 是**单对象** `{…}`。顶层可多出 `rank`/`status`/`designHash` 等。
2. **`test_channel[i][j].testGeo[]` ≡ 该 channel `geoGroup.test.code[]`**；**`controlGeo[]` ≡ `geoGroup.control(.｀[0]｀).code[]`**。
3. **顶层标量列要与 geoGroup 对齐**：`method` = geoGroup.method、`country` = geoGroup.country、`geo_level` = geoGroup.test.geoLevel。
4. **manual holdout / matched reference**：顶层 `geo_group` 允许是 `{"status":"NOT_EXIST"}`（真实数据只在 channel）。一旦要把顶层填成实体 geoGroup，就必须与 channel 那份一致（见下方 workflow）。
5. **改 length 会牵动结束时间**：`test_end_time` = `test_start_time` + (`test_length` + `cooling_length` − 1) 天（前端也会按 geoGroup 重算并回写）。只改 length 不管 `test_end_time`，两者会对不上。

> 结论式判断：**只有当"要改的内容"本身是 geo pairing（换 test/control 地区、改 test_length/cooling_length）时，才必须多处一起改。** 若只是顶层 `geo_group` 缺失/为 `NOT_EXIST`、而 channel 已是正确数据，则**只补顶层**即可（把顶层写成与 channel 一致的实体 geoGroup）。

## 手工 UPDATE 工作流

按这四步走，别跳：

**① 定位并快照当前值**（确认改的就是这条，留一份旧值好回滚）

```sql
SELECT id, tenant_id, approach, method, geo_level,
       JSON_EXTRACT(geo_group, '$.status') AS top_status,
       geo_group AS old_geo_group
FROM platform.lift_test_group
WHERE id = :id AND tenant_id = :tenant_id;
```

**② 判断改动范围**（对照上面的不变量）

- 只是顶层缺失、channel 已正确 → 只 `UPDATE geo_group`。
- 改了 geo pairing（地区/length）→ 同时改 `geo_group`、对应 `test_channel[i][j].geoGroup`、`testGeo`/`controlGeo`，并复算 `test_end_time`。

**③ 写入**（json 列直接赋合法 JSON 字符串；按 `id`+`tenant_id` 双限定；bump `update_time`）

```sql
UPDATE platform.lift_test_group
SET geo_group = '<合法 JSON>',
    update_time = NOW()
WHERE id = :id AND tenant_id = :tenant_id;
```

改 channel 里的子字段用 `JSON_SET`/`JSON_REPLACE` 精确定位，例如
`JSON_SET(test_channel, '$[0][0].geoGroup.cooling_length', '7')`，避免整列重写误伤其它字段。

**④ 写后校验一致性**（关键——确认两份对齐）

```sql
SELECT id,
       JSON_EXTRACT(geo_group, '$.status')                             AS top_status,        -- 期望 NULL（不再是 NOT_EXIST）
       JSON_TYPE(JSON_EXTRACT(geo_group, '$.control'))                 AS top_control_type,  -- 期望 ARRAY
       JSON_EXTRACT(geo_group, '$.id')                                 AS top_id,
       JSON_EXTRACT(test_channel, '$[0][0].geoGroup.id')               AS ch_id,             -- 应与 top_id 相等
       JSON_EXTRACT(geo_group, '$.test_length')                        AS top_test_len,
       JSON_EXTRACT(test_channel, '$[0][0].geoGroup.test_length')      AS ch_test_len,       -- 应相等
       JSON_LENGTH(JSON_EXTRACT(geo_group, '$.test.code'))             AS top_test_n,
       JSON_LENGTH(JSON_EXTRACT(test_channel, '$[0][0].testGeo'))      AS ch_testGeo_n       -- 应相等
FROM platform.lift_test_group
WHERE id = :id AND tenant_id = :tenant_id;
```

## 列清单（27 列）

fe 字段指 `CreateLiftTestGroup`（camelCase）。JSON 列内部结构见 [references/objects.md](references/objects.md)。

| #   | 列                    | 类型     | fe 字段             | 说明                                                                          |
| --- | --------------------- | -------- | ------------------- | ----------------------------------------------------------------------------- |
| 1   | id                    | bigint   | id                  | 主键                                                                          |
| 2   | name                  | varchar  | name                | 测试名称                                                                      |
| 3   | tenant_id             | bigint   | tenantId            | 租户（UPDATE 时务必带上做限定）                                               |
| 4   | purpose               | varchar  | purpose             | 常为 null                                                                     |
| 5   | primary_metric        | varchar  | primaryMetric       | orders / sales / …                                                            |
| 6   | approach              | varchar  | approach            | `automatic` / `manual`                                                        |
| 7   | dma_exclusion         | json     | dmaExclusion        | 常 `[]`                                                                       |
| 8   | **geo_group**         | json     | geoGroup            | 顶层聚合 geo；manual holdout 可为 `{status:NOT_EXIST}`                        |
| 9   | **test_channel**      | json     | testChannel         | 子实验 `LiftTestItem[][]`；per-channel geoGroup 在这                          |
| 10  | test_start_time       | datetime | testStartTime       | **只存日期(00:00)**；时分在 `extra_info.startTime`                            |
| 11  | test_end_time         | datetime | testEndTime         | = start +(test_length+cooling_length−1) 天                                    |
| 12  | status                | varchar  | status              | draft / scheduled / active / …                                                |
| 13  | workflow_id           | bigint   | —(后端)             | 编排 workflow id                                                              |
| 14  | execute_message       | json     | executeMessage      | 执行报错等                                                                    |
| 15  | extra_info            | json     | extraInfo           | timezone / startTime(时分) / currentStep / geoSizeValue / restrictStartDate … |
| 16  | create_time           | datetime | createTime          |                                                                               |
| 17  | update_time           | datetime | updateTime          | 手工改后记得 bump                                                             |
| 18  | ad_platform           | json     | adPlatform          | 如 `["tiktokMarketing"]`                                                      |
| 19  | country               | varchar  | country             | 与 geoGroup.country 对齐                                                      |
| 20  | method                | varchar  | method              | `PTM` / `LTM`，与 geoGroup.method 对齐                                        |
| 21  | test_level            | varchar  | testLevel           | platform / tactic / campaign                                                  |
| 22  | sales_channel         | json     | salesChannel        |                                                                               |
| 23  | metric_filters        | json     | metricFilters       |                                                                               |
| 24  | metric_filters_config | json     | metricFiltersConfig |                                                                               |
| 25  | geo_level             | varchar  | geoLevel            | dma/state/postcode，与 geoGroup.test.geoLevel 对齐                            |
| 26  | location_setting      | json     | locationSetting     | `{locationType, locations[]}`                                                 |
| 27  | additional_info       | json     | additionalInfo      | numberOfCells / relatedGroupIdList / clusterGroupId …                         |

> `geoSizeValue` 无独立列，存 `extra_info.geoSizeValue`（0~6 枚举）。

## 复用子对象速览

（完整字段表见 [references/objects.md](references/objects.md)）

- **geo item `GeoGroupValue`**：`{id, code[], name[], sales, orders, geoLevel, part_date}`；**仅 control 多** `factor` / `minimum_detectable_lift` / `shopify_daily_control_orders`。出现在每个 geoGroup 的 `test`(对象) 和 `control`(顶层数组 / channel 对象)。
- **geoGroup**：两处出现——顶层 `geo_group` 列（fe `GeoGroup`，`control` 数组）与 `test_channel[].geoGroup`（fe `LiftTestGeoGroup`，`control` 对象）。共有 `id/test/method/control/country/estimator/test_length/cooling_length`；顶层可多 `rank/status/designHash/group_id/design_id`。
- **estimator `GeoGroupEstimator`**：每个 geoGroup 内一份。`channel` 是二维数组 `EstimatorChannelItem[][]`（外层 ≈channel group，内层每个 = 一个 ad platform），另有 `experiment_days`（number 或 string），可选 `expect_cpa`/`minimum_daily_budget_required`/`custom_test_length`。

## geoGroup.designHash（geoHash）怎么算 + 何时必须同步

`geoGroup.designHash` / `design_hash` 是 **design 输入参数的 MD5**（不是 geo 配对结果的 hash），前端用它判断"设计输入变没变"。**改数据时最容易漏掉它**：一旦手工改了任何 design 输入却没同步重算 hash，一进 Geo-Pairing 步骤就会触发重新出 design（"刷新"）。

**算法**（`src/utils/md5.ts` + `src/utils/object.ts`）：

```
designHash = md5(params)
           = SparkMD5.hash( JSON.stringify( getSortedKeysObject(params) ) )
```

`getSortedKeysObject` = 递归把对象 key 按字典序排序（数组保持顺序）。等价 Node：`crypto.createHash('md5').update(JSON.stringify(sortKeysDeep(params))).digest('hex')`（已用线上真实记录验证过，逐字节一致）。

**两个 builder**，由 `checkUseOnlineDesign(...)` 选（见 `CreateLiftTest/utils/index.ts`）：

- **offline**：`md5({ country, geoLevel, testChannel: [[{ adPlatform }]], geoSizeValue })`
- **online**：`md5(getOnlineDesignParams(...))`，params =
  ```
  { tenant_id: <当前租户字符串>, salesChannel: [...],
    salesChannelConfig: salesChannel.map(c => ({ channel: c, metricFiltersConfig: [...过滤后...] })),
    primaryMetric: (=== 'orders' ? 'orders' : 'nc_orders'),
    country, geoLevel,
    holdout_pct: Number(GEO_SIZE_OPTIONS_MAP[geoSizeValue][0]),   // MINIMUM=0.05, _5=0.05, _10=0.1, _15=0.15, _20=0.2, _25=0.25, _30=0.3
    locationSetting,                                             // 已并入 concurrent 自动规避段
    testChannel: [[{ adPlatform }]] }
  ```

**designHash vs design_hash**：`designHash` = 不含并发信息；`design_hash` = 含并发（`concurrentTestInfo.geoCodes` 并入 `locationSetting`）。比对时 `groupHash = geoGroup.designHash || geoGroup.design_hash`。

**为什么进 geo 会刷新**（`useGeoPairingData.tsx`）：进 Geo-Pairing 时用当前 live 输入重算 `currentDesignHash`，与库里 `geoGroup.designHash` 比——**不相等或缺失**（例如 manual holdout 顶层 `NOT_EXIST` 无 hash、或改了平台/geoLevel 等输入）→ `isHashChanged`，且 `useOnlineDesign` 为真时触发 online 重新出 design（就是那个刷新）。正常编辑不刷新，是因为输入没动、hash 相等。

**结论（改数据校验项）**：手工改任何 design 输入 —— `country` / `geoLevel` / `salesChannel` / `testChannel[].adPlatform`（换平台！）/ `geoSizeValue` / `metricFilters` / `locationSetting` —— 都必须**用上面算法重算 `geoGroup.designHash` 并写回**，否则一进 geo 就刷新（且 manual holdout 可能因此丢掉手工 pin 的 geo）。

**designHash 只改顶层，别套用「两处一起改」**：`designHash` 是 per-location 的，顶层 `geo_group` 与 `test_channel[].geoGroup` **各有各的、通常不同**（实测 2621：顶层 `03f37dba…` ≠ channel `75e75043…`；manual holdout 的 channel geoGroup 往往根本没有 designHash）。它**不属于**「一致性不变量」里必须两处对齐的字段（那批是 geos / lengths / estimator / method / country）。而且进 geo 的刷新判定**只读顶层** `info.geoGroup.designHash`（`useGeoPairingData` line 405），所以手工修 designHash **只改顶层 geo_group 即可**，不用同步 channel。

## 关键陷阱

1. **顶层 `control` 是数组、channel 里是对象** —— 两处别用同一套解构；写顶层 geo_group 时 `control` 一定包成 `[{…}]`。**刷数/refresh 时 `geo_group.control[0]`（数组元素）最容易被漏**：它和 channel 的 `geoGroup.control`（对象）是同一份 control geo（sales/orders/factor/minimum_detectable_lift/shopify_daily_control_orders），JSON 路径却不同（顶层 `$.control[0]` vs channel `$.geoGroup.control`），只按对象路径刷会漏掉顶层数组元素。同步用：`JSON_SET(geo_group, '$.control[0]', JSON_EXTRACT(test_channel,'$[0][0].geoGroup.control'), '$.test', JSON_EXTRACT(test_channel,'$[0][0].geoGroup.test'))`。
2. **数字可能是 number 也可能是 string**（如 `cooling_length:"7"`、`experiment_days:"21"`、`sales:"0.161128"`）。经验：**online design 多给 number，manual/老数据多给 string**，同一对象里也可能一个 number 一个 string（实测 manual holdout：`test_length` 21 是 number、`cooling_length` "7" 是 string）。**取值一律 `Number(...)` 兜**，别信 TS 里 number/string 的字面声明。
3. **manual holdout 顶层 geoGroup 是 `{status:"NOT_EXIST"}`** —— 前端 Scheduling 直接读 `info.geoGroup.test_length` 会拿到 `undefined` → `NaN`，这就是 **End date "Invalid Date"** 的数据诱因。补顶层为实体 geoGroup 即可修复（且要与 channel 一致）。
4. **test_start_time 只存日期(00:00)**，真实时分在 `extra_info.startTime`（保存时 `mergeDate` 合并）。
5. **part_date 格式不统一**：可能是 `'2026-06-17'` 也可能是 `'2026-07-07 17:45:04'`。
6. **改动只落一处** 是最常见 bug：改 geo pairing 必须 geo_group + test_channel[].geoGroup + testGeo/controlGeo 一起改，见「一致性不变量」。

## 常见问题速查

- **test_length / cooling_length 在哪？** `geo_group.test_length` 与每个 `test_channel[].geoGroup.test_length`（manual holdout 只有后者）。
- **estimator 在哪？** `geo_group.estimator` + 每个 `test_channel[].geoGroup.estimator`。
- **test / control 地区代码？** `geoGroup.test.code[]` / `geoGroup.control`(顶层数组 / channel 对象)`.code[]`，另有 channel 顶层的 `testGeo[]`/`controlGeo[]` 镜像。
- **开始时间时分？** `extra_info.startTime`。
- **manual 还是 automatic？** 列 `approach`；再看顶层 `geo_group` 是否 `{status:NOT_EXIST}`。
- **multi-cell 兄弟实验？** `additional_info.relatedGroupIdList` / `relatedGroupId` / `clusterGroupId`。

## 查询/执行提示

- 只读查询用 `mcp__…__workmagic_query`（**只能 SELECT，跑不了 UPDATE**）。UPDATE 需在业务库（`api` 数据源）上执行。
- 取 JSON 子字段用 `JSON_EXTRACT` / `JSON_VALUE`；改子字段用 `JSON_SET`/`JSON_REPLACE`；写整列前可 `SELECT JSON_VALID('<JSON>')` 验证合法性。
- test_channel 很大（含 campaigns 等），按需 `JSON_EXTRACT` 只取要看的路径，别无脑 `select *` 全表 dump。
