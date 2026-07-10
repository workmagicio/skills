# lift-test-apply-design

给定一个 `design_id`，生成把该 design 的 **geo pairing 回填/写入到它关联的那条 `platform.lift_test_group`** 的整套 SQL：**正向 `JSON_SET` UPDATE + 配套回滚 UPDATE + 写后校验**。

这是一个**内部运维 / 改数据**技能：它产出的是直接打在业务库（platform-api 的 `api` 数据源）上的 `UPDATE` 语句，不是产品化的 API 调用。只读查询工具跑不了 `UPDATE`，需要人工在业务库执行。

> ⚠️ 本技能会改动生产配置数据（乃至已上线实验的运行期数据）。**每条正向 UPDATE 都配一条回滚 UPDATE**（先只读查出改动前原值，再整列写回还原，不是 SELECT 快照），这是唯一的回滚依据。不要凭记忆手拼这条 SQL，也不要只改一处。

---

## 何时用 / 何时不用

- ✅ 把某条**已存在**实验的 geo pairing 换/回填为某个 design（“apply / swap online design into a lift test group”）。
- ❌ 从零构造一条全新 group（需额外 name / 平台 / campaigns，不在范围）。
- ❌ 只想查看 design 或 group 内容 —— 直接查表即可，不必用本技能。

触发语例：「把某个 design 写入/回填/换进 lift_test_group 的 geo_group」「给 design_id 生成改 geo pairing 的 update sql」「把某个 lift test 的 test/control 地区换成某 design」。

## 输入 / 输出

| | 内容 |
| --- | --- |
| **输入** | 一个 `design_id`（来自 `platform.ads_order_dma_design_budget_manual_v2`）。技能用该 design 行的 `lift_test_group_id` 定位目标 group。 |
| **输出** | ① 自查改动前原值 → ② 正向 `UPDATE lift_test_group` + ②-回滚 UPDATE → ③（仅当有 `lift_test` 行）逐行正向 `UPDATE lift_test` + ③-回滚 UPDATE → ④ 写后校验。每条正向 UPDATE 都配一条整列还原的回滚 UPDATE。 |

## 前置依赖

1. **必读同级技能 [`lift-test-group-schema`](../lift-test-group-schema/SKILL.md)** —— 深层落表结构与一致性不变量的权威依据。本技能只负责“design → group 回填”这个特定动作的映射与 SQL 生成，通用规则不重复，**先按它校验、再给 SQL**。
2. 只读查询工具（能读到 `platform.*` 业务库表）用于前置探查；`UPDATE` 本身需交付给用户在业务库（`api` 数据源）执行。

## 硬前置（不满足就停，别硬生成）

按顺序校验，任一不过就说明原因、不给 `UPDATE`：

1. design 行存在，取到 `tenant_id` / `lift_test_group_id` / geo 与统计字段等。
2. `lift_test_group_id` 非空（空 = 该 design 未关联任何 group，停下让用户指定目标）。
3. tenant 一致：`group.tenant_id == design.tenant_id`。
4. method / country / geo_level 对齐（不一致通常意味着选错了 design）。
5. 探明 `test_channel` 形状（外层 / 内层 `JSON_LENGTH`、顶层 `control` 是 ARRAY、channel `control` 是 OBJECT）。
6. 探测 group 下是否已有 `platform.lift_test` 行 —— 决定改动范围（见下）。

## 目录结构

```
lift-test-apply-design/
├── SKILL.md                              # 主 playbook（agent 执行手册）
├── README.md                            # 本文件（人看的导览）
└── references/
    ├── queries.md                        # 探查 SQL + lift_test_group 的 UPDATE 骨架 + 交付前只读 dry-run
    ├── lift-test-sync.md                 # 非 draft 实验：同步 platform.lift_test（行 ↔ cell 对应、逐行 UPDATE 骨架）
    └── worked-example-2608.md            # 完整真实样例：design 6219…4e 回填进 group 2608（已只读 dry-run 验证）
```

## 关键约束速览（细节见 SKILL.md）

- **多处 geo 必须同步改**：顶层 `geo_group`、每个 `test_channel[i][j].geoGroup`、每个 cell 的镜像 `testGeo`/`controlGeo`；非 draft 时还有每条 `lift_test` 的 `test_geo`/`control_geo`/`geo_group` —— 同一份 geo 可能存在 6+ 处。
- **顶层 `control` 是数组、channel 里是对象**：顶层写 `$.control[0].xxx`，channel 写 `$[i][j].geoGroup.control.xxx`。漏改顶层 `control[0]` 是最常见错误。
- **`estimator` 整块保留不动**（分平台各异、含内部 `design_id` 标签），逐 cell 只改 geo 路径、各自保留 estimator。
- **保留字段绝不动**：`designHash`（设计输入的 MD5，回填只换 geo 结果不该变）、`test_length` / `cooling_length` / `test_end_time` 等。
- **有损字段**：`control.factor` 与 `shopify_daily_control_orders` 是 design 行快照，可能与原始 online 跑批值有细微差。
- **别用 `SET @var` 中转**：执行环境会拦截独立 SET 语句 —— 所有值内联进单条 `UPDATE`（数组用 `CAST('[...]' AS JSON)`、标量写数字字面量）。
- **非 draft 实验**：group 下有 `lift_test` 行时必须逐行连带同步；且对 **active（在跑）** 实验，本 SQL 只改 DB 记录，**不会**重推广告平台 targeting / 重跑 workflow，需另行协调。

## 作为 Skill 加载

把整个 `lift-test-apply-design/` 目录放到 agent 能发现 skill 的位置即可（如 `~/.claude/skills/` 或项目 `.claude/skills/`）。因为它依赖 [`lift-test-group-schema`](../lift-test-group-schema/SKILL.md)，请把该同级技能一并放入，`../` 相对链接才能解析。
