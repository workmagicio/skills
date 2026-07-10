# 完整样例：把 design `6219bf45e46808005328af4320f70a4e` 回填进 group 2608

真实数据、只读 dry-run 验证过的一次完整产出。tenant 150272，LTM，US/dma，单 channel（googleAds），3-cell 家族的 `_2` cell。design 行 `id=1639` 的 `lift_test_group_id` 就是 2608。

## 探查结果（前置全过）

- design 行：`lift_test_group_id=2608`、`test_method=LTM`、`geo_country=US`、level=dma、`part_date=2026-07-05`、`parent_design_id=6219bf45e46808005328af4320f70a4e_2`。
- group 2608：`status=draft`✅、`outer_len=1`、`inner_len=1`（只 `[0][0]`）、顶层 control=ARRAY、channel control=OBJECT、`designHash=a987b1c59291f7ef5664f4250e38850b`、`test_length=28`。

## ① 取改动前原值（自查，不作交付物）

先用只读工具查出 2608 待改列的当前整列值，留作回滚素材：

```sql
SELECT geo_group, test_channel FROM platform.lift_test_group
WHERE id = 2608 AND tenant_id = 150272;
```

## ② UPDATE

全内联单条语句（**不用 `SET @var`**——执行环境会拦截独立 SET）。2608 顶层与 channel 的 design_id 旧值都是 `online-` 前缀，故两处都写 `online-<id>`；别的 group 可能顶层 `online-`、channel 裸值，按各位置旧值决定。

```sql
UPDATE platform.lift_test_group
SET
  geo_group = JSON_SET(geo_group,
    '$.id', 'online-6219bf45e46808005328af4320f70a4e',
    '$.design_id', 'online-6219bf45e46808005328af4320f70a4e',
    '$.group_id', '6219bf45e46808005328af4320f70a4e_2',
    '$.part_date', '2026-07-05',
    '$.test.code', CAST('["753","567","596","633","693","736","506","642","670","789","521","527","542","628"]' AS JSON),
    '$.test.name', CAST('["PHOENIX (PRESCOTT)","GREENVLL - SPART - ASHEVLL - AND","ZANESVILLE","ODESSA - MIDLAND","LITTLE ROCK - PINE BLUFF","BOWLING GREEN","BOSTON (MANCHESTER)","LAFAYETTE, LA","FT. SMITH - FAY - SPRNGDL - RGRS","TUCSON (SIERRA VISTA)","PROVIDENCE - NEW BEDFORD","INDIANAPOLIS","DAYTON","MONROE - EL DORADO"]' AS JSON),
    '$.test.orders', 0.083049, '$.test.sales', 0.080604,
    '$.control[0].id', 'online-6219bf45e46808005328af4320f70a4e',
    '$.control[0].code', CAST('["523","551","604","634","641","676","801","500","507","525","588","609","610","619","651","515","547","550","566","598","617","658"]' AS JSON),
    '$.control[0].name', CAST('["BURLINGTON - PLATTSBURGH","LANSING","COLUMBIA - JEFFERSON CITY","AMARILLO","SAN ANTONIO","DULUTH - SUPERIOR","EUGENE","PORTLAND - AUBURN","SAVANNAH","ALBANY, GA","SOUTH BEND - ELKHART","ST. LOUIS","ROCKFORD","SPRINGFIELD, MO","LUBBOCK","CINCINNATI","TOLEDO","WILMINGTON","HARRISBURG - LNCSTR - LEB - YORK","CLARKSBURG - WESTON","MILWAUKEE","GREEN BAY - APPLETON"]' AS JSON),
    '$.control[0].orders', 0.073153, '$.control[0].sales', 0.0722,
    '$.control[0].factor', 0.048718,
    '$.control[0].minimum_detectable_lift', 10,
    '$.control[0].shopify_daily_control_orders', 179.924338
  ),
  test_channel = JSON_SET(test_channel,
    '$[0][0].geoGroup.id', 'online-6219bf45e46808005328af4320f70a4e',
    '$[0][0].geoGroup.design_id', 'online-6219bf45e46808005328af4320f70a4e',
    '$[0][0].geoGroup.group_id', '6219bf45e46808005328af4320f70a4e_2',
    '$[0][0].geoGroup.part_date', '2026-07-05',
    '$[0][0].geoGroup.test.code', CAST('["753","567","596","633","693","736","506","642","670","789","521","527","542","628"]' AS JSON),
    '$[0][0].geoGroup.test.name', CAST('["PHOENIX (PRESCOTT)","GREENVLL - SPART - ASHEVLL - AND","ZANESVILLE","ODESSA - MIDLAND","LITTLE ROCK - PINE BLUFF","BOWLING GREEN","BOSTON (MANCHESTER)","LAFAYETTE, LA","FT. SMITH - FAY - SPRNGDL - RGRS","TUCSON (SIERRA VISTA)","PROVIDENCE - NEW BEDFORD","INDIANAPOLIS","DAYTON","MONROE - EL DORADO"]' AS JSON),
    '$[0][0].geoGroup.test.orders', 0.083049, '$[0][0].geoGroup.test.sales', 0.080604,
    '$[0][0].geoGroup.control.id', 'online-6219bf45e46808005328af4320f70a4e',
    '$[0][0].geoGroup.control.code', CAST('["523","551","604","634","641","676","801","500","507","525","588","609","610","619","651","515","547","550","566","598","617","658"]' AS JSON),
    '$[0][0].geoGroup.control.name', CAST('["BURLINGTON - PLATTSBURGH","LANSING","COLUMBIA - JEFFERSON CITY","AMARILLO","SAN ANTONIO","DULUTH - SUPERIOR","EUGENE","PORTLAND - AUBURN","SAVANNAH","ALBANY, GA","SOUTH BEND - ELKHART","ST. LOUIS","ROCKFORD","SPRINGFIELD, MO","LUBBOCK","CINCINNATI","TOLEDO","WILMINGTON","HARRISBURG - LNCSTR - LEB - YORK","CLARKSBURG - WESTON","MILWAUKEE","GREEN BAY - APPLETON"]' AS JSON),
    '$[0][0].geoGroup.control.orders', 0.073153, '$[0][0].geoGroup.control.sales', 0.0722,
    '$[0][0].geoGroup.control.factor', 0.048718,
    '$[0][0].geoGroup.control.minimum_detectable_lift', 10,
    '$[0][0].geoGroup.control.shopify_daily_control_orders', 179.924338,
    '$[0][0].testGeo', CAST('["753","567","596","633","693","736","506","642","670","789","521","527","542","628"]' AS JSON),
    '$[0][0].controlGeo', CAST('["523","551","604","634","641","676","801","500","507","525","588","609","610","619","651","515","547","550","566","598","617","658"]' AS JSON)
  ),
  update_time = NOW()
WHERE id = 2608 AND tenant_id = 150272;   -- 2608 是 draft，无 lift_test 行，只改这一张表
```

## ②-回滚（备份 = 可执行 UPDATE，非 SELECT）

把 ① 查到的原始 `geo_group` / `test_channel` 整列写回（全内联；真实交付时把 `<…原始 JSON>` 换成 ① 查到的整列值，JSON 内单引号转义成 `''`）：

```sql
UPDATE platform.lift_test_group
SET geo_group    = CAST('<2608 改动前 geo_group 原始 JSON>' AS JSON),
    test_channel = CAST('<2608 改动前 test_channel 原始 JSON>' AS JSON)
WHERE id = 2608 AND tenant_id = 150272;
```

## ③ 写后校验

```sql
SELECT
  JSON_EXTRACT(geo_group,'$.design_id')                        AS gg_design_id,   -- "online-6219bf45e46808005328af4320f70a4e"
  JSON_EXTRACT(test_channel,'$[0][0].geoGroup.design_id')      AS ch_design_id,   -- 相等
  JSON_LENGTH(JSON_EXTRACT(geo_group,'$.test.code'))           AS gg_test_n,      -- 14
  JSON_LENGTH(JSON_EXTRACT(test_channel,'$[0][0].testGeo'))    AS ch_test_n,      -- 14
  JSON_LENGTH(JSON_EXTRACT(geo_group,'$.control[0].code'))     AS gg_ctrl_n,      -- 22
  JSON_LENGTH(JSON_EXTRACT(test_channel,'$[0][0].controlGeo')) AS ch_ctrl_n,      -- 22
  JSON_EXTRACT(geo_group,'$.designHash')                       AS hash_unchanged, -- "a987b1c59291f7ef5664f4250e38850b"
  JSON_EXTRACT(geo_group,'$.test_length')                      AS len_unchanged   -- 28
FROM platform.lift_test_group WHERE id = 2608 AND tenant_id = 150272;
```

## dry-run 验证结论（只读、未落库）

把 ② 的两个 `JSON_SET`（本身已内联，无需改写）放进一个 `SELECT` 子查询套在现有行上（`SELECT JSON_SET(geo_group, …) AS gg2, JSON_SET(test_channel, …) AS tc2 FROM … WHERE id=2608`，不落库），得到：
`gg_valid=1`、`tc_valid=1`、顶层与 channel `design_id` 都为 `online-6219bf45…`、`test=14`/`control=22` 两处一致、`control[0].factor=0.048718`、`MDL=10`、`designHash=a987…` 未变、`test_length=28` 未变、channel `control` 仍是 OBJECT、`name="20260706 - Google - 20% DTC Orders"` 保留。

## 有损/保留提示（要一并告诉用户）

- `factor`(0.048718) / `shopify_daily_control_orders`(179.92) 是 design 行快照；`estimator` **整块保留不动**（含里面的 `design_id` 标签），沿用旧 design 8cdf 的预算估计。
- MDL 从旧值 16.42 变成 10；`designHash / test_length(28) / cooling_length(7) / test_end_time / name / adPlatform / impactCampaigns` 全部保留。
- 3-cell 家族：只改了 2608（cell `_2`），兄弟 group 2609（cell `_1`）未动。
