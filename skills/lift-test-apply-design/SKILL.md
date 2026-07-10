---
name: lift-test-apply-design
description: 给定 platform.ads_order_dma_design_budget_manual_v2 的一个 design_id，生成把该 design 的 geo pairing 回填/写入到其关联 platform.lift_test_group（用 design 行的 lift_test_group_id 定位）的整套 SQL：正向 JSON_SET UPDATE + 配套回滚 UPDATE + 写后校验。当用户要「把某个 design 写入/回填/换进 lift_test_group 的 geo_group」「给 design_id 生成改 geo pairing 的 update sql」「把某个 lift test 的 test/control 地区换成某 design」「apply / swap online design into a lift test group」时，一定用本 skill：它会先做前置校验（tenant 一致、design 行有 lift_test_group_id、探明 test_channel 形状、探测 group 下是否已有 platform.lift_test 行），再按 lift-test-group-schema 的一致性不变量把 geo_group + 每个 test_channel[i][j].geoGroup + testGeo/controlGeo + 顶层 control[0] 多处同步改；若 group 已非 draft（scheduled/active/completed，下有 lift_test 行），会连带同步 platform.lift_test 表每行的 test_geo/control_geo/geo_group，并提示对已上线实验改 geo 只动 DB 记录、不重推 targeting/workflow 的风险；每条正向 UPDATE 都配一条回滚 UPDATE（先自查改动前原值再整列内联还原，不是 SELECT 快照）。生成的 UPDATE 只读工具跑不了，需在业务库（api 数据源）执行。不要凭记忆手拼这条 SQL，也不要只改一处。
---

# 把 design 回填进 lift_test_group

给一个 `design_id`（来自 `platform.ads_order_dma_design_budget_manual_v2`），产出把该 design 的 geo pairing 写进它**关联的那条** `platform.lift_test_group` 的 SQL。

**这条链路的方向要先搞清楚**：正常产品流程里，design 行是**从** group 的 geoGroup 派生写出去的（`useCreateOnlineDesign` → `/api/design/manual`），不是 group 从 design 行来。所以"回填 design → group"是**逆着一个有损转换**走——能精确还原的：geo 地区、orders/sales、MDL、method/country/geoLevel、id/design_id；**无法从 design 行还原**的：`control.factor`、`control.shopify_daily_control_orders`（行里存的是另一套快照值，且原始 online 跑批值没落库）。这一点直接决定了下面的"有损字段"处理。

深层结构与一致性不变量的权威依据是同级 skill [lift-test-group-schema](../lift-test-group-schema/SKILL.md)：**先读它、按它校验**。本 skill 只负责"design → group 回填"这个特定动作的映射与 SQL 生成，不重复它的通用规则。

## 何时用 / 何时不用

- ✅ 换/回填某条已存在实验的 geo pairing 为某个 design（本 skill）。
- ❌ 从零构造一条全新 group（需额外 name/平台/campaigns，不在范围）。
- ❌ 只想查看 design 或 group 内容 → 直接查表即可，不必用本 skill。

## 硬前置（不满足就停，别硬生成）

按顺序校验，任一不过就明确告诉用户原因、不要给 UPDATE：

1. **design 行存在**，取到 `tenant_id`、`lift_test_group_id`、geo 与统计字段、`design_id`、`parent_design_id`、`part_date`、`test_method`、`geo_country`、`geo_test_level`、`geo_control_level`。
2. **`lift_test_group_id` 非空** —— 空说明这个 design 还没和任何 group 关联，停下来让用户显式指定目标 group id（那是"换到指定 group"的另一种用法）。
3. **tenant 一致**：group.tenant_id == design.tenant_id。
4. **method / country / geo_level 对齐**：group 的三个标量列应与 design 一致；不一致要提示（通常意味着选错了 design，别默默改）。
5. **探明 `test_channel` 形状**：`JSON_LENGTH(test_channel)`（外层）、`JSON_LENGTH(test_channel->'$[0]')`（内层），确认要写的所有 `[i][j]` 下标；确认顶层 `geo_group.control` 是 ARRAY、`test_channel[i][j].geoGroup.control` 是 OBJECT（两处形状不同是规定，不是 bug）。
6. **探测 group 下有没有 `lift_test` 行**（`SELECT id, test_channel_index, status FROM platform.lift_test WHERE lift_test_group_id = :gid`）—— 这决定改动范围，**替代了旧的"只准 draft"判断**：
   - **无行** —— draft 实验，geo 只在 `lift_test_group`，按「产出」只改这一张表。
   - **有行** —— 实验已 scheduled/active/completed，`lift_test` 是运行期读的那份，**必须连它一起改**（见「当 group 下有 lift_test」）。此时**强提醒并让用户确认**：对已上线（active）实验改 geo，本 SQL 只改 DB 记录，**不会**把新 targeting 重推广告平台 / 重跑 workflow，需另行协调；completed 改 geo 一般只用于事后修数据。

探明形状用只读工具（`mcp__…__workmagic_query`）即可，见 [references/queries.md](references/queries.md) 的探查 SQL。

## 字段映射：覆盖 vs 保留

**覆盖（来自 design 行）：**

| geoGroup 路径                          | 来源（design 行列）                                         | 备注                                                                                                                                                            |
| -------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` / `design_id` / `control.id`      | 旧值前缀 + 新 `design_id`                                   | ⚠ **沿用各位置原有前缀**再换 design token：实测顶层常 `online-<id>`、但 channel/lift_test 可能是**裸 `<id>`**（2386）。别一律加 `online-`；读该位置旧值决定前缀 |
| `group_id`                             | `parent_design_id`                                          | 原样，不做字符串加工（不同家族 `_N` 位置可能不一致）                                                                                                            |
| `part_date`                            | `part_date`                                                 |                                                                                                                                                                 |
| `test.code` / `test.name`              | `geo_test_dma_code` / `geo_test_dma_name`                   | JSON 数组                                                                                                                                                       |
| `test.orders` / `test.sales`           | `shopify_test_order_rate` / `shopify_test_sales_rate`       | 数字字面量                                                                                                                                                      |
| `control.code` / `control.name`        | `geo_control_dma_code` / `geo_control_dma_name`             |                                                                                                                                                                 |
| `control.orders` / `control.sales`     | `shopify_control_order_rate` / `shopify_control_sales_rate` |                                                                                                                                                                 |
| `control.minimum_detectable_lift`      | `minimum_detectable_lift`                                   |                                                                                                                                                                 |
| `control.factor`                       | `factor`                                                    | ⚠ **有损快照**，非原始 online 值                                                                                                                                |
| `control.shopify_daily_control_orders` | `shopify_daily_control_orders`                              | ⚠ **有损快照**                                                                                                                                                  |
| `test.geoLevel` / `control.geoLevel`   | `geo_test_level` / `geo_control_level`                      | 一般不变，可不写                                                                                                                                                |
| `estimator`（整块）                    | —                                                           | **不动、整块保留**：estimator 分平台各异（含里面的 `design_id` 标签），别逐 `[x][y]` 改标签，改错会误伤多平台的花费结构                                         |

以上要在**每个位置各写一遍**：顶层 `geo_group`（control 用 `$.control[0]`，实测**始终单元素数组**）、**每个** `test_channel[i][j].geoGroup`（control 用 `…geoGroup.control`）、每个 channel 的镜像 `testGeo`/`controlGeo`。多平台时各 cell 的 **geo 相同、但 geoGroup 整体不同（estimator 分平台）** —— 所以**逐 cell `JSON_SET` geo 路径、各自保留 estimator**，切勿用一份 geoGroup 整体覆盖所有 cell/行。

**保留（group 原值，绝不动）：**

- `designHash`（**关键**）：它是**设计输入**的 MD5，不是 geo 结果的 hash。回填只换 geo 结果、没换输入（平台/geoLevel/salesChannel/geoSize/locationSetting 都是 group 原样），所以 hash 不该变——保留它，进 Geo-Pairing 步骤才不会触发刷新、正好显示写入的 geo。**千万别重算或清空**。
- `test_length` / `cooling_length`：实验时长是 group 侧配置（常见 test_length ≠ design.experiment_days），不被 design 覆盖。
- `test_end_time`：length 不变 → 结束时间不变，不需要复算。
- `estimator` 的花费/cpa/daily_spend、`name`、`adPlatform` / `ad_platform`、`status`、`extraInfo`、`impactCampaignInfos`、`primaryMetric`、`location_setting`、`additional_info`、`test_start_time`。

## 当 group 下有 lift_test（非 draft 实验）

geo pairing 在**运行期**由 `platform.lift_test` 承载（每个 channel cell 一行，`test_channel_index` ↔ `test_channel[i][j]`）。draft 只动 `lift_test_group`；一旦有 lift_test 行，**同一份 geo 现在存在 6+ 处**，全都要对齐：

- `lift_test_group.geo_group`（顶层，control 数组）
- 每个 `lift_test_group.test_channel[i][j].geoGroup`（control 对象）+ `testGeo`/`controlGeo`
- **每条 `lift_test` 的 `geo_group`（control 对象）+ `test_geo` + `control_geo`**

实测最强不变量（跨表校验点）：**`lift_test.geo_group` 与它对应那个 cell 的 `test_channel[i][j].geoGroup` 逐字节相等**（key 集一致：`id/rank/test/method/control/country/group_id/design_id/estimator/part_date/designHash/test_length/cooling_length/lift_test_group_id`）。所以对 `lift_test.geo_group` 的 `JSON_SET` = 对应 channel geoGroup 那套**把 `$[i][j].geoGroup.` 前缀换成 `$.`**。⚠ 但各 cell 之间 geoGroup **并不相等**（estimator 分平台），是「每行对上自己的 cell」，**不是**「所有行同一份」。

**行 ↔ cell 对应（两段键，单看 index 不够）**：`test_channel_index` 定**外层 i**，`ad_platform` 定**内层 j** —— 实测：外层多 cell 时各行 index=0/1…不同（如 1262）；单外层多平台时各行 index 都=0，只能靠 `ad_platform` 区分到 `[0][j]`（如 2386 的 tiktokMarketing→`[0][0]`、tiktokGMVMax→`[0][1]`）。swap 前用「旧 `lift_test.test_geo` == 旧 `test_channel[i][j].testGeo`」核对没错位。

**lift_test 每行要改**（对每行分别 `JSON_SET`，各自保留 estimator）：

- `test_geo` = design 的 test code 数组；`control_geo` = design 的 control code 数组（同一 group 内 geo 统一，所有行同值）。
- `geo_group`：`$.id`/`$.design_id`/`$.control.id`（**沿用该行原值前缀换新 token，别硬加 `online-`**）、`$.group_id` = `parent_design_id`、`$.part_date`、`$.test.{code,name,orders,sales}`、`$.control.{code,name,orders,sales,factor,minimum_detectable_lift,shopify_daily_control_orders}`。

**lift_test 要保留（别动）：** geo_group 内的 `rank` / `lift_test_group_id` / `designHash` / `test_length` / `cooling_length` / **`estimator`（整块，含 design_id 标签）**；以及列 `name` / `ad_platform` / `primary_metric` / `test_start_time` / `test_end_time` / `status` / `workflow_id` / `impact_campaign_infos` / `origin_targeting` / `change_record`。

lift_test 探查与 UPDATE 骨架见 [references/lift-test-sync.md](references/lift-test-sync.md)。

## 产出：正向 UPDATE + 配套回滚 UPDATE + 写后校验

**每条正向 `UPDATE` 都必须紧跟一条回滚 `UPDATE`**（把被改列整列还原为改动前原值），即使用户没要——这是唯一的回滚依据。回滚值必须在执行正向前用只读工具查出。**有 lift_test 时两张表、每条 lift_test 行都各配回滚 UPDATE。**

**① 先取改动前原值（你自己查，SELECT 不作交付物）**

用只读工具查出待改列的当前整列值，留作回滚素材（有 lift_test 时每行都查、按 id 一一对应）：

```sql
SELECT geo_group, test_channel FROM platform.lift_test_group
WHERE id = :group_id AND tenant_id = :tenant_id;
-- 有 lift_test 时，每行都查
SELECT id, test_geo, control_geo, geo_group FROM platform.lift_test
WHERE lift_test_group_id = :group_id AND tenant_id = :tenant_id;
```

**② UPDATE `lift_test_group`**（api 数据源执行；`WHERE id=:group_id AND tenant_id=:tenant_id`，bump `update_time`）。**所有值内联进这一条 UPDATE，勿用 `SET @var`**（执行环境会拦截独立 SET 语句）：数组用 `CAST('[...]' AS JSON)` 内联、标量写数字字面量。`JSON_SET` 只精确改列出路径，不整列重写。骨架见 [references/queries.md](references/queries.md)，真实样例见 [references/worked-example-2608.md](references/worked-example-2608.md)。

> ⚠ **不再用 `status='draft'` 兜底** —— 现在会故意改非 draft 实验，靠 `id`+`tenant_id` 精确限定即可。

**②-回滚**（紧跟 ②）：把 ① 查到的原始 `geo_group` / `test_channel` **整列写回**（同样全内联、勿用 `SET @var`；JSON 里的单引号转义成 `''`）。整列还原比逆向 `JSON_SET` 稳，也覆盖"正向新增了原本没有的路径"：

```sql
UPDATE platform.lift_test_group
SET geo_group    = CAST('<① 查到的 geo_group 原始 JSON>' AS JSON),
    test_channel = CAST('<① 查到的 test_channel 原始 JSON>' AS JSON)
WHERE id = :group_id AND tenant_id = :tenant_id;
```

**③ UPDATE `lift_test`（仅当有行，按 `lift_test.id` 逐行、同样全内联）**：每条 lift_test 对应 `test_channel[i][j]`（`i=test_channel_index`、`j` 由 `ad_platform` 定位）改 `test_geo`、`control_geo`、`geo_group`（**和对应 channel geoGroup 完全同一套 `JSON_SET`**，control 是 OBJECT → `$.control.xxx`）。见「当 group 下有 lift_test」+ [references/lift-test-sync.md](references/lift-test-sync.md)。

**③-回滚**（每条正向紧跟一条）：把 ① 查到的**该行**原始值整列写回，按 `lift_test.id` 逐行（各行原值不同，别一次覆盖所有行）：

```sql
UPDATE platform.lift_test
SET test_geo    = CAST('<该行原始 test_geo>' AS JSON),
    control_geo = CAST('<该行原始 control_geo>' AS JSON),
    geo_group   = CAST('<该行原始 geo_group>' AS JSON)
WHERE id = :lt_id AND tenant_id = :tenant_id;
```

**④ 写后校验**（有 lift_test 时**跨两表**核对）

```sql
SELECT
  JSON_EXTRACT(geo_group,'$.design_id')                        AS gg_design_id,   -- online-<design_id>
  JSON_EXTRACT(test_channel,'$[0][0].geoGroup.design_id')      AS ch_design_id,   -- 相等
  JSON_LENGTH(JSON_EXTRACT(geo_group,'$.test.code'))           AS gg_test_n,
  JSON_LENGTH(JSON_EXTRACT(test_channel,'$[0][0].testGeo'))    AS ch_test_n,      -- 相等
  JSON_LENGTH(JSON_EXTRACT(geo_group,'$.control[0].code'))     AS gg_ctrl_n,
  JSON_LENGTH(JSON_EXTRACT(test_channel,'$[0][0].controlGeo')) AS ch_ctrl_n,      -- 相等
  JSON_EXTRACT(geo_group,'$.designHash')                       AS hash_unchanged, -- 与 ① 原值一致
  JSON_EXTRACT(geo_group,'$.test_length')                      AS len_unchanged
FROM platform.lift_test_group WHERE id = :group_id AND tenant_id = :tenant_id;
-- 有 lift_test 时再核一遍表 ↔ group 对齐：
SELECT lt.test_channel_index,
       JSON_EXTRACT(lt.geo_group,'$.design_id') AS lt_design_id,  -- = gg_design_id
       JSON_LENGTH(lt.test_geo)                 AS lt_test_n,     -- = gg_test_n
       JSON_LENGTH(lt.control_geo)              AS lt_ctrl_n      -- = gg_ctrl_n
FROM platform.lift_test lt
WHERE lt.lift_test_group_id = :group_id AND lt.tenant_id = :tenant_id;
```

多 channel 时对每个 `[i][j]` 与每条 lift_test 都要核一遍。可选：生成前用只读工具把同样 `JSON_SET` 套现有行 `SELECT`（不落库）验证 JSON 合法 + 计数正确再交付。

## 三个必踩的坑

1. **别用 `SET @var` 中转**：执行环境会拦截独立的 `SET @x := …` 语句（当成非法/多语句 DML）。所有值**内联**进单条 UPDATE：数组写 `CAST('["753",...]' AS JSON)`（JSON 文本直接 CAST，别当普通字符串——否则会带引号变成字符串），标量写数字字面量。
2. **顶层 control 是数组、channel 里是对象**：顶层写 `$.control[0].xxx`，channel 写 `$[i][j].geoGroup.control.xxx`。同一份 control geo 两条不同路径，漏了顶层 `control[0]` 是最常见错误（见 lift-test-group-schema「关键陷阱」）。
3. **非 draft 忘了改 `lift_test`**：group 下有 lift_test 行时只改 `lift_test_group` 会让运行期数据（lift_test 才是实验实际读的那份）与配置分裂。有行必须逐行同步 `lift_test` 的 `test_geo`/`control_geo`/`geo_group`，并按 `test_channel_index` 对应到正确 channel。

## 交付时要一并说清的话

- 只读工具跑不了 UPDATE，需你在业务库（api 数据源）执行；如可行，交付前我用只读 `SELECT`+`JSON_SET` 做了 dry-run。
- `factor` / `shopify_daily_control_orders` 是 design 行快照，可能与原始 online 跑批有细微差；`estimator` 花费/cpa 保留的是 group 原值（沿用旧 design 的预算估计），只同步了里面的 `design_id` 标签。
- 若该 design 属于 multi-cell（3-cell）家族：本 SQL 只改它关联的这一条 group，兄弟 group（`additional_info.relatedGroupIdList`）不受影响，要一起换需按各自 design_id 分别跑。
- 若 group 非 draft（有 lift_test 行）：已连带改 `lift_test`；但对 **active（在跑）** 实验，这只改 DB 记录，**不会**重推广告平台 targeting / 重跑 workflow，需另行协调；completed 改 geo 一般仅为事后修数据。
