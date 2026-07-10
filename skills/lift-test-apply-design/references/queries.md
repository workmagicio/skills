# 探查 SQL + UPDATE 骨架

只读探查用 `mcp__…__workmagic_query`（仓库里连的 warehouse 能读到 `platform.*` 业务库表）。UPDATE 本身跑不了，只能交付给用户在业务库（api 数据源）执行。

## A. 取 design 行（拿映射所需的全部字段）

```sql
SELECT id, tenant_id, lift_test_group_id, design_id, parent_design_id, part_date,
       test_method, geo_country, geo_test_level, geo_control_level,
       geo_test_dma_code, geo_test_dma_name, geo_control_dma_code, geo_control_dma_name,
       shopify_test_order_rate, shopify_test_sales_rate,
       shopify_control_order_rate, shopify_control_sales_rate,
       factor, minimum_detectable_lift, shopify_daily_control_orders,
       experiment_days, cooling_period
FROM platform.ads_order_dma_design_budget_manual_v2
WHERE design_id = :design_id;
```

- `lift_test_group_id` 为空 → 停（让用户指定 group）。
- 若同一 `design_id` 命中多行（LIKE 家族别混），务必按精确等值取，必要时再带上 `id`。

## B. 探明目标 group 的状态与 test_channel 形状

```sql
SELECT id, tenant_id, status, method, country, geo_level,
       JSON_LENGTH(test_channel)                              AS outer_len,
       JSON_LENGTH(JSON_EXTRACT(test_channel,'$[0]'))         AS inner_len,
       JSON_TYPE(JSON_EXTRACT(geo_group,'$.control'))         AS top_control_type,   -- 期望 ARRAY
       JSON_TYPE(JSON_EXTRACT(test_channel,'$[0][0].geoGroup.control')) AS ch_control_type, -- 期望 OBJECT
       JSON_EXTRACT(geo_group,'$.designHash')                 AS design_hash,        -- 保留基线
       JSON_EXTRACT(geo_group,'$.test_length')                AS test_length,        -- 保留基线
       JSON_KEYS(JSON_EXTRACT(geo_group,'$.control[0]'))      AS top_ctrl_keys,
       JSON_KEYS(JSON_EXTRACT(test_channel,'$[0][0]'))        AS ch_item_keys
FROM platform.lift_test_group
WHERE id = :group_id AND tenant_id = :tenant_id;
```

- `status != 'draft'` → 停。
- `outer_len` / `inner_len` 决定要写哪些 `[i][j]`。单 channel 就是 `[0][0]`；多 channel 对每个下标都要写一份 `geoGroup` + `testGeo`/`controlGeo`（它们共用同一份 test/control geo）。

## C. UPDATE 骨架（占位符替换后交付）

**不要用 `SET @var`**（执行环境会拦截独立 SET 语句）——所有值**内联**进这一条 UPDATE。数组用 `CAST('[...]' AS JSON)` 内联（JSON 文本直接 CAST，别当普通字符串写，否则会带引号成字符串）；数字写字面量。**id/design_id/control.id 按位置原前缀写字面值**：顶层与 channel 前缀可能不同（2608 都 `online-`；2386 顶层 `online-`、channel 裸值），生成前查该位置旧值决定。`group_id` = design 行 `parent_design_id`。同一份数组文本会重复出现（test.code 在顶层/channel/testGeo，control.code 同理），逐处内联即可。

```sql
UPDATE platform.lift_test_group
SET
  geo_group = JSON_SET(geo_group,
    '$.id', '<顶层前缀><design_id>', '$.design_id', '<顶层前缀><design_id>',
    '$.group_id', '<parent_design_id>', '$.part_date', '<part_date>',
    '$.test.code', CAST('<test code JSON>' AS JSON), '$.test.name', CAST('<test name JSON>' AS JSON),
    '$.test.orders', <shopify_test_order_rate>, '$.test.sales', <shopify_test_sales_rate>,
    '$.control[0].id', '<顶层前缀><design_id>',       -- 顶层 control 始终单元素数组，只 $.control[0]
    '$.control[0].code', CAST('<control code JSON>' AS JSON), '$.control[0].name', CAST('<control name JSON>' AS JSON),
    '$.control[0].orders', <shopify_control_order_rate>, '$.control[0].sales', <shopify_control_sales_rate>,
    '$.control[0].factor', <factor>,                                   -- ⚠ 快照
    '$.control[0].minimum_detectable_lift', <minimum_detectable_lift>,
    '$.control[0].shopify_daily_control_orders', <shopify_daily_control_orders>  -- ⚠ 快照
  ),
  test_channel = JSON_SET(test_channel,
    -- 对每个 [i][j] 重复以下一组（下面以 [0][0] 为例）；estimator 整块不动
    '$[0][0].geoGroup.id', '<channel 前缀><design_id>', '$[0][0].geoGroup.design_id', '<channel 前缀><design_id>',
    '$[0][0].geoGroup.group_id', '<parent_design_id>', '$[0][0].geoGroup.part_date', '<part_date>',
    '$[0][0].geoGroup.test.code', CAST('<test code JSON>' AS JSON), '$[0][0].geoGroup.test.name', CAST('<test name JSON>' AS JSON),
    '$[0][0].geoGroup.test.orders', <...>, '$[0][0].geoGroup.test.sales', <...>,
    '$[0][0].geoGroup.control.id', '<channel 前缀><design_id>',   -- channel 里 control 是 OBJECT，无 [0]
    '$[0][0].geoGroup.control.code', CAST('<control code JSON>' AS JSON), '$[0][0].geoGroup.control.name', CAST('<control name JSON>' AS JSON),
    '$[0][0].geoGroup.control.orders', <...>, '$[0][0].geoGroup.control.sales', <...>,
    '$[0][0].geoGroup.control.factor', <...>,
    '$[0][0].geoGroup.control.minimum_detectable_lift', <...>,
    '$[0][0].geoGroup.control.shopify_daily_control_orders', <...>,
    '$[0][0].testGeo', CAST('<test code JSON>' AS JSON),
    '$[0][0].controlGeo', CAST('<control code JSON>' AS JSON)
  ),
  update_time = NOW()
WHERE id = :group_id AND tenant_id = :tenant_id;
```

> ⚠ 已去掉 `status='draft'` 限定（现在支持改非 draft；有 lift_test 时按 [lift-test-sync.md](lift-test-sync.md) 逐行一并改）。多 channel 对每个 `[i][j]` 重复 geoGroup + testGeo + controlGeo 那组；**estimator 一律不动**。所有值内联，勿用 `SET @var`。交付时这条正向 UPDATE 必须**紧跟一条回滚 UPDATE**（先只读查出 `geo_group`/`test_channel` 原值，再整列写回）——见 [SKILL.md](../SKILL.md)「产出」②-回滚。

## D. 交付前只读 dry-run（强烈推荐）

把上面两个 `JSON_SET`（已内联，原样）搬进一个 `SELECT` 子查询套在现有行上（`SELECT JSON_SET(geo_group,…) AS gg2, JSON_SET(test_channel,…) AS tc2 FROM … WHERE id=:group_id`，不落库），校验：`JSON_VALID(...)=1`、`design_id` 顶层与 channel 各自符合预期、`test/control` 计数正确、`designHash`/`test_length` 未变、channel `control` 仍是 OBJECT、`name` 等保留字段还在。用 `mcp__…__workmagic_query` 跑即可（它只接受单条 SELECT/WITH，而这里本就不用变量）。样例见 worked-example-2608.md。
