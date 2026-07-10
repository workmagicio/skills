# 非 draft 实验：同步 platform.lift_test

group 一旦非 draft（scheduled/active/completed），运行期 geo 由 `platform.lift_test` 承载：**每个 channel cell 一行**。改 geo 时这些行必须和 `lift_test_group` 一起改。

## 行 ↔ cell 对应（两段键，单看 index 不够）

一条 `lift_test` = 一个 `test_channel[i][j]` cell：

- `test_channel_index` = **外层 i**。外层多 cell 时各行 index 不同（1262：facebook idx0→`[0][0]`、google idx1→`[1][0]`）。
- `ad_platform` = 定位**内层 j**。单外层多平台时**各行 index 都=0**，只能靠平台区分（2386：tiktokMarketing→`[0][0]`、tiktokGMVMax→`[0][1]`）。
- 实测不变量：**`lift_test.geo_group` 与它对应那个 cell 的 `test_channel[i][j].geoGroup` 逐字节相等**；但各 cell 之间不等（estimator 分平台）。所以是「每行对上自己的 cell」。
- swap 前务必用「旧 `lift_test.test_geo` == 旧 `test_channel[i][j].testGeo`」把行和 cell 对齐核实一遍。

## lift_test 与 geo 相关的列

| 列                                                                                                                                                                     | 说明                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                                                                                                                                                   | 主键（UPDATE 直接按它定位一行，最稳）                                                                                                                                                                                                                   |
| `lift_test_group_id` / `test_channel_index` / `ad_platform`                                                                                                            | 定位到 group 与 cell                                                                                                                                                                                                                                    |
| `test_geo` (json)                                                                                                                                                      | test DMA code 数组，= 对应 cell `testGeo` = `geo_group.test.code`（同 group 内所有行同值）                                                                                                                                                              |
| `control_geo` (json)                                                                                                                                                   | control DMA code 数组，= `controlGeo` = `geo_group.control.code`                                                                                                                                                                                        |
| `geo_group` (json)                                                                                                                                                     | **channel 形状** geoGroup（`control` 是 OBJECT），与对应 `test_channel[i][j].geoGroup` 同结构、逐字节相等：key 集 `id/rank/test/method/control/country/group_id/design_id/estimator/part_date/designHash/test_length/cooling_length/lift_test_group_id` |
| `name`/`ad_platform`/`primary_metric`/`test_start_time`/`test_end_time`/`status`/`workflow_id`/`impact_campaign_infos`/`origin_targeting`/`change_record`/`extra_info` | 实验配置/运行态，**保留不动**                                                                                                                                                                                                                           |

## A. 探查 + 行 ↔cell 核对

```sql
SELECT lt.id, lt.test_channel_index AS i, CAST(lt.ad_platform AS CHAR) AS plat,
       JSON_TYPE(JSON_EXTRACT(lt.geo_group,'$.control')) AS lt_ctrl_type,  -- 期望 OBJECT
       JSON_LENGTH(lt.test_geo)  AS lt_test_n,
       JSON_LENGTH(lt.control_geo) AS lt_ctrl_n,
       CAST(JSON_EXTRACT(lt.test_geo,'$[0]') AS CHAR)  AS lt_test_first,
       CAST(JSON_EXTRACT(lt.geo_group,'$.design_id') AS CHAR) AS lt_design_id  -- 看该行原前缀（online-? 裸?）
FROM platform.lift_test lt
WHERE lt.lift_test_group_id = :group_id AND lt.tenant_id = :tenant_id;
```

对每行，再和它推定的 cell `test_channel[i][j]` 比对 `testGeo`（旧值应相等）确认下标 `i,j` 没错位——`i = test_channel_index`，`j` 由 `ad_platform` 在 `test_channel[i]` 里找到。

## B. UPDATE 骨架（**按 `lift_test.id` 逐行，全内联，勿用 `SET @var`**）

`geo_group` 的 `JSON_SET` = 对应 `test_channel[i][j].geoGroup` 那套，前缀 `$[i][j].geoGroup.` 换成 `$.`（control 是 OBJECT，无 `[0]`）。数组用 `CAST('[...]' AS JSON)` 内联、数字写字面量。**id/design_id/control.id 按该行 `geo_group` 原前缀写**：旧值 `online-<old>` 就写 `online-<new_design_id>`、旧值裸 `<old>` 就写裸 `<new_design_id>`（实测 channel/lift_test 侧常无 `online-` 前缀）。`group_id` = design 行 `parent_design_id`。

```sql
UPDATE platform.lift_test
SET
  test_geo    = CAST('<test code JSON>' AS JSON),
  control_geo = CAST('<control code JSON>' AS JSON),
  geo_group = JSON_SET(geo_group,
    '$.id', '<该行前缀><design_id>', '$.design_id', '<该行前缀><design_id>',
    '$.group_id', '<parent_design_id>', '$.part_date', '<part_date>',
    '$.test.code', CAST('<test code JSON>' AS JSON), '$.test.name', CAST('<test name JSON>' AS JSON),
    '$.test.orders', <shopify_test_order_rate>, '$.test.sales', <shopify_test_sales_rate>,
    '$.control.id', '<该行前缀><design_id>',
    '$.control.code', CAST('<control code JSON>' AS JSON), '$.control.name', CAST('<control name JSON>' AS JSON),
    '$.control.orders', <shopify_control_order_rate>, '$.control.sales', <shopify_control_sales_rate>,
    '$.control.factor', <factor>,                                    -- ⚠ 快照
    '$.control.minimum_detectable_lift', <minimum_detectable_lift>,
    '$.control.shopify_daily_control_orders', <shopify_daily_control_orders>
  ),
  update_time = NOW()
WHERE id = :lt_id AND tenant_id = :tenant_id;
```

- **`estimator` 整块不动**（分平台各异，含里面的 `design_id` 标签）——不出现在 `SET` 里。geo_group 内 `rank`/`lift_test_group_id`/`designHash`/`test_length`/`cooling_length` 及上面「保留不动」的列同理。
- 有几行就按各自 `:lt_id` 重复本段（对应的 `test_channel[i][j]` 那份 geoGroup 在 group 的 UPDATE 里同步改）。别用「去掉限定一次性覆盖所有行」——会把各行的 estimator 冲掉。
- **每条正向 UPDATE 紧跟一条回滚 UPDATE**：先只读查出该行 `test_geo`/`control_geo`/`geo_group` 原值，再按同一 `:lt_id` 整列写回——见 [SKILL.md](../SKILL.md)「产出」③-回滚。

## C. 交付前只读 dry-run + 写后跨表校验

- dry-run：把 `JSON_SET(geo_group, …)`（内联 `CAST('[...]' AS JSON)`）套现有 lift_test 行 `SELECT`，验 `JSON_VALID=1`、`design_id`、`test/control` 计数、`control` 仍 OBJECT、`rank`/`lift_test_group_id`/`designHash`/`test_length` 未变。
- 写后：核对**每条 `lift_test.geo_group` 与它对应 `test_channel[i][j].geoGroup` 再次逐字节相等**，且两处 `test_geo`/`testGeo`、`control_geo`/`controlGeo` 一致：

```sql
SELECT lt.id, lt.test_channel_index AS i, CAST(lt.ad_platform AS CHAR) AS plat,
       (CAST(lt.test_geo AS CHAR)  = CAST(JSON_EXTRACT(g.geo_group,'$.test.code') AS CHAR))    AS testgeo_eq_top,
       (CAST(lt.control_geo AS CHAR) = CAST(JSON_EXTRACT(g.geo_group,'$.control[0].code') AS CHAR)) AS ctrlgeo_eq_top
FROM platform.lift_test lt
JOIN platform.lift_test_group g ON g.id = lt.lift_test_group_id
WHERE lt.lift_test_group_id = :group_id AND lt.tenant_id = :tenant_id;
```
