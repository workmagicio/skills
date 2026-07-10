# 子对象逐字段 schema + 跨位置一致性 + 真实样本

配合 `SKILL.md` 使用。类型标 `number|string` 的表示**实测两种都出现过**，取值一律 `Number()`。

## 1. `GeoGroupValue`（geo item：test / control 的地理单元）

出现在每个 geoGroup 的 `test`（单对象）与 `control`（顶层数组 / channel 单对象）里。

| 字段                         | 类型           | test | control | 说明                                 |
| ---------------------------- | -------------- | :--: | :-----: | ------------------------------------ |
| id                           | string         |  ✓   |    ✓    | 该 geo 分组 id                       |
| code[]                       | string[]       |  ✓   |    ✓    | 地区代码（DMA 编号 / 州编号 / 邮编） |
| name[]                       | string[]       |  ✓   |    ✓    | 地区名，和 code[] 同序               |
| sales                        | number\|string |  ✓   |    ✓    | 销售占比                             |
| orders                       | number\|string |  ✓   |    ✓    | 订单占比                             |
| geoLevel                     | string         |  ✓   |    ✓    | dma / state / postcode               |
| part_date                    | string         | 可选 |  可选   | 日期或 datetime，格式不统一          |
| factor                       | number\|string |  —   |    ✓    | **仅 control**                       |
| minimum_detectable_lift      | number\|string |  —   |    ✓    | **仅 control**                       |
| shopify_daily_control_orders | number\|string |  —   |    ✓    | **仅 control**                       |
| new_customers                | number         | 可选 |  可选   |                                      |

## 2. geoGroup —— 两处形状对照

`fe GeoGroup`（顶层 `geo_group` 列） vs `fe LiftTestGeoGroup`（`test_channel[i][j].geoGroup`）。

| 字段               |       顶层 `geo_group`       |    channel `.geoGroup`    | 说明                                                                          |
| ------------------ | :--------------------------: | :-----------------------: | ----------------------------------------------------------------------------- |
| id                 |            string            |          string           | 顶层与 channel 的 id **可不同**（顶层=聚合/选中 design，channel=per-channel） |
| test               |        GeoGroupValue         |       GeoGroupValue       | 单对象                                                                        |
| **control**        | **GeoGroupValue[]（数组）**  | **GeoGroupValue（对象）** | ⚠️ 形状不同                                                                   |
| method             |           PTM\|LTM           |         PTM\|LTM          |                                                                               |
| country            |            string            |          string           |                                                                               |
| estimator          |      GeoGroupEstimator       |     GeoGroupEstimator     |                                                                               |
| test_length        |        number\|string        |      number\|string       | 实测 online=number；本身可能是 string                                         |
| cooling_length     |        number\|string        |      number\|string       | 实测 manual 常为 string `"7"`                                                 |
| group_id           |         string\|null         |      string（可选）       | online 有；manual 可能 null/缺                                                |
| design_id          |            string            |          string           | 顶层 `online-<hash>_1`；channel `<hash>_1`                                    |
| part_date          |            string            |      string（可选）       |                                                                               |
| designHash         |            string            |      string（可选）       | 顶层与 channel 的 hash 通常不同                                               |
| rank               |    number\|string（可选）    |             —             | 顶层专有                                                                      |
| status             | `EXIST`\|`NOT_EXIST`（可选） |             —             | **manual holdout 未建时，顶层整个对象 = `{"status":"NOT_EXIST"}`**            |
| lift_test_group_id |        string（可选）        |             —             | 部分数据有                                                                    |

## 3. `GeoGroupEstimator`（每个 geoGroup 内一份）

| 字段                          | 类型                     | 说明                                                 |
| ----------------------------- | ------------------------ | ---------------------------------------------------- |
| channel                       | EstimatorChannelItem[][] | 二维：外层 ≈channel group，内层每项=一个 ad platform |
| experiment_days               | number\|string           |                                                      |
| expect_cpa                    | number                   | 可选                                                 |
| minimum_daily_budget_required | number                   | 可选                                                 |
| custom_test_length            | number                   | 可选                                                 |

### `EstimatorChannelItem`

| 字段                                                       | 类型   | 说明                                         |
| ---------------------------------------------------------- | ------ | -------------------------------------------- |
| ad_platform                                                | string | tiktokMarketing / snapchatMarketing / nift … |
| channel_index                                              | number |                                              |
| expected_daily_spend                                       | number |                                              |
| cpa / origin_cpa                                           | number | 可选                                         |
| ads_daily_reported_spend / origin_ads_daily_reported_spend | number | 可选                                         |
| ads_daily_reported_orders                                  | number | 可选（TS 有）                                |
| ad_platform_name                                           | string | 可选                                         |
| design_id                                                  | string | 可选（TS 有）                                |

## 4. 跨位置一致性矩阵（改数据时逐条核对）

| 语义             | 位置 A                                                                      | 位置 B（必须与 A 一致）                                 | 形状/类型差异                                                           |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| geo pairing 整体 | `geo_group`                                                                 | `test_channel[i][j].geoGroup`                           | 顶层 control 数组 / channel control 对象；顶层多 rank/status/designHash |
| test 地区        | `geoGroup.test.code[]`                                                      | 同 channel 的 `testGeo[]`                               | 无（都是 string[]）                                                     |
| control 地区     | `geoGroup.control[0].code[]`（顶层） / `geoGroup.control.code[]`（channel） | 同 channel 的 `controlGeo[]`                            | 顶层 control 是数组，取 `[0]`                                           |
| method           | 列 `method`                                                                 | `geoGroup.method`                                       |                                                                         |
| country          | 列 `country`                                                                | `geoGroup.country`                                      |                                                                         |
| geo level        | 列 `geo_level`                                                              | `geoGroup.test.geoLevel`                                |                                                                         |
| 时长             | `geoGroup.test_length` / `cooling_length`                                   | 顶层与 channel 两份                                     | number/string 混用                                                      |
| 结束时间         | 列 `test_end_time`                                                          | = `test_start_time` + (test_length+cooling_length−1) 天 | 改 length 必须复算                                                      |

## 5. 三条真实样本（地区数组已截断）

### A. automatic / online design PTM（id 2621，GB / postcode）—— 顶层 geoGroup 已填充

```jsonc
// 列 geo_group（顶层，control 为数组）
{
  "id": "online-7e21f88e…_1",
  "method": "PTM",
  "country": "GB",
  "group_id": "7e21f88e…",
  "design_id": "online-7e21f88e…_1",
  "designHash": "03f37dba…",
  "part_date": "2026-06-17",
  "test_length": 21,
  "cooling_length": 7, // 都是 number（online 来源）
  "test": {
    "code": ["2075", "2023", "2040", "…35 total"],
    "sales": 0.261921,
    "orders": 0.260456,
    "geoLevel": "postcode"
  },
  "control": [
    {
      "id": "online-7e21f88e…_1",
      "code": ["2092", "2062", "…30 total"],
      "factor": 0.03688,
      "minimum_detectable_lift": 38.31,
      "shopify_daily_control_orders": 1038.69,
      "geoLevel": "postcode"
    }
  ],
  "estimator": {
    "channel": [[{ "ad_platform": "snapchatMarketing", "channel_index": 0, "expected_daily_spend": 796.52 }]],
    "experiment_days": 21
  }
}
// test_channel[0][0].geoGroup：同一份，但 control 是单对象、design_id="7e21f88e…_1"（无 online- 前缀）、
// designHash 不同、estimator 多 expect_cpa/minimum_daily_budget_required。testGeo/controlGeo 与 code[] 对齐（35/30）。
```

### B. manual holdout PTM（id 2592，US / dma）—— 顶层 geoGroup 缺失

```jsonc
// 列 geo_group（顶层）—— 就一个哨兵
{ "status": "NOT_EXIST" }

// test_channel[0][0].geoGroup —— 真实数据在这（control 是单对象）
{
  "id": "manual-20260701_150092_tiktok_gmvmax_holdout", "method": "PTM", "country": "US",
  "test_length": 21, "cooling_length": "7",               // ⚠️ test_length=number、cooling_length=string
  "test":    { "code": ["508","509","516","…35 total"], "sales": 0.062564, "orders": 0.065304, "geoLevel": "dma" },
  "control": { "id": "manual-…_holdout_30", "code": ["513","526","…30 total"], "factor": 0.02049, "minimum_detectable_lift": 17.39, "shopify_daily_control_orders": 848.86, "geoLevel": "dma" },
  "estimator": { "channel": [[{ "ad_platform": "tiktokMarketing", "channel_index": 0, "cpa": 73.34, "origin_cpa": 73.34, "expected_daily_spend": 2869.97, "ads_daily_reported_spend": 855.0, "origin_ads_daily_reported_spend": 855.0 }]], "experiment_days": 21 }
}
// 把顶层补成实体 geoGroup 时：control 要包成数组、可加 rank/designHash，其余与本 channel 一致。
```

### C. manual LTM（id 2618，US / state）—— 顶层 control 为数组，含 rank/lift_test_group_id

```jsonc
// 列 geo_group（顶层）
{
  "id": "online-a7b078e2…_1",
  "rank": 999999,
  "method": "LTM",
  "country": "US",
  "group_id": null,
  "design_id": "a7b078e2…_1",
  "designHash": "a494a2ba…",
  "part_date": "2026-07-07 17:45:04", // 这里是完整 datetime
  "test_length": 28,
  "cooling_length": "7", // number + string 混用
  "lift_test_group_id": "2618",
  "test": { "code": ["39", "41", "14", "…9 total"], "sales": "0.161128", "orders": "0.175755", "geoLevel": "state" }, // 值是 string
  "control": [
    {
      "id": "online-a7b078e2…_1",
      "code": ["33", "34", "…5 total"],
      "factor": "0.050539",
      "minimum_detectable_lift": "12.960605",
      "shopify_daily_control_orders": "256.445597",
      "geoLevel": "state"
    }
  ],
  "estimator": {
    "channel": [
      [
        {
          "ad_platform": "nift",
          "ad_platform_name": "nift",
          "channel_index": 0,
          "cpa": 73.67,
          "origin_cpa": 73.67,
          "expected_daily_spend": 954.81,
          "ads_daily_reported_spend": 618.29,
          "origin_ads_daily_reported_spend": 618.29
        }
      ]
    ],
    "experiment_days": "21"
  }
}
```

## 6. 数字 number/string 经验

| 来源                                | 典型                                                                        | 备注                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| online design（approach=automatic） | 多为 number（`sales:0.26`、`cooling_length:7`）                             |                                                                      |
| manual / matched reference / 老数据 | 多为 string（`sales:"0.16"`、`cooling_length:"7"`、`experiment_days:"21"`） | 同一对象里 `test_length` 可能是 number 而 `cooling_length` 是 string |

**结论**：读这些字段一律 `Number(x)`；写 JSON 时尽量沿用同租户/同 test 已有的类型风格，别在一条记录里制造新的不一致。
