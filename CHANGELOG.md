# Changelog

All notable changes to the WorkMagic public skills are recorded here. This repo follows the
[Agent Skills open standard](https://agentskills.io); each skill is independently versioned in
its `SKILL.md` frontmatter (`version:` / `last-updated:`).


## 2026-10-28（2.4.0）

### Added

- **`lift-test-creation` 2.4.0：每轮用 `conversation-log` 记录一组问答，可按 `conversation_id` 还原一次意图的完整过程。**
  配合 platform-mcp 新工具 `conversation-log`（通用，所有 skill 可用；调用本身即记录，落 `platform.audit_event`，不建新表）
  和全部工具上注入的可选参数 `conversation_id`。
  - SKILL.md 新增 §5.4：一个 `conversation_id` = 一个意图（做出一个 draft，含对它的修改、design deck 和后续追问），由 agent 自定
    （`ltc-YYYYMMDD-xxxxxx`），每轮按表判断 `new` / `continue` / `related`；新窗口里说"继续 draft 3301"也是 `new` + `related_draft_id`；
    与创建 lift test 无关的轮次不记。
  - 每轮一次，作为最后一个工具调用、紧挨回复之前：本轮用户原话 + 即将发出的回复（发出时不改）。
    每条记录就是一组完整问答；切换意图、用户中途离开都不会漏。
  - 结束或暂停意图的那一轮带 `outcome`：同一轮既建 / 改 draft 又建 deck 时取 draft 那个；只是重发已有 deck 链接不带；"下周再说"是 `paused`（之后同窗口回来沿用原 id），明确不做了才是 `stopped_by_user`。`draft_id` 只在本轮建了 / 改了 draft 时带。
  - 凡是指向本窗口某个 draft 的问题（含"怎么分享给 CFO"这类用法问题）都按 `continue` 记。
  - 其它 platform-MCP 工具调用都带同一个 `conversation_id`；§6 工具表加 `conversation-log`。
  **上线顺序**：须在 platform-mcp 的 `conversation-log`（workmagicio/platform-mcp `feature-conversation-log`）发布后或同时发；
  工具不存在时按 §5.4 的失败规则（重试一次后跳过）不影响建测试。

## 2026-10-28（2.3.3）

### Changed

- **`lift-test-creation` 2.3.3：把「Holdout/Exposed 地区取自 treated 侧」提成全局硬规则,并改掉失效的自查。**
  2.3.2 的 `display_groups` 修好了 Step 5 表格那条路,但离线自测里 2/4 次搞反发生在**表格之外的散文**(补充说明、最终总结)——规则只在 output-templates(模型没读)里,SKILL 正文只有一句。
  - SKILL.md 新增 **§9 CRITICAL 规则 10**(并 §7 同步):任何地方提到 Holdout/Exposed 地区——设计表、draft 总结、DS 交接摘要、solve-loop 说明、补充文字——一律取 `display_groups.treated[i]`(回退 `geo_group.control[i]`);`geo_group.test` 是 Reference,永不列成员名,永不出现在 treatment 行;不确定就不列名字。
  - output-templates.md 回退自查:从「数量和占比来自不同侧」弱启发式(两侧大小接近时查不出,如 3 vs 3 DMA、17.8% vs 17.6%)改为**直接核对 Holdout/Exposed 名单 == `geo_group.control[i].name`**;用 `display_groups` 时无需自查。
  纯文案,不改工具调用。(CPA 的 `database-query-ask` 前置经实测确认非必需——`ctx` 必填但不校验,编造时间戳不会被拒,故未改。)

## 2026-10-28（2.3.2）

### Changed

- **`lift-test-creation` 2.3.2：Step 5 的实验组改为优先读 `display_groups`,不再手动在 `geo_group` 的 test/control 间导航。**
  配合 platform-mcp：`lift-test-design-analyze` 和 `lift-test-get` 现在在每个 design 上返回只读的 `display_groups`
  （`treated[i]` = 已按方法贴好 label 的 Holdout/Exposed 组,带 geo_names / geo_count / order_share_pct;
  `reference` = 只给 count 和 order_share,不含成员名）。
  - output-templates.md Step 5 取数表改为「优先 `display_groups`,无该字段时回退 `geo_group.control[i]` / `geo_group.test`」;
    因 `display_groups.treated[i]` 是单个对象,占比/个数/名单不可能跨侧拆分,原「发送前核对两侧」的防呆简化为仅回退路径适用。
  - SKILL.md §7 设计表要求同步:优先 `display_groups`,回退 `control[i]`,treatment 行永不取 `geo_group.test`。
  背景:字面 `test`/`control` 与实验角色相反,模型读原始 JSON 常把 Reference 列成 Holdout(离线 A/B:列错 reference 5→0 次)。
  **上线顺序**:须在 platform-mcp 的 `display_groups`(workmagicio/platform-mcp `feature-lift-test-analyze-display-groups`)发布后或同时发;回退路径保证 MCP 未发时也不出错。

## 2026-10-27（2.3.1）

### Changed

- **`lift-test-creation` 2.3.1：并发实验 geo 规则改为按组判定 + 时间窗口，地区约束统一由 platform-api 计算。**
  对齐 platform-mcp `lift-test-design-prepare` / `lift-test-create` 的新行为：
  - 其他实验**改动组**占用的 geo：本实验两组都避开；只被其他实验**对照组**占用的 geo：只避开本实验改动组（两边对照组重叠允许，不再当作冲突）。
  - 只算本实验开始日（prepare 的 `startTime`，不传取今天）仍被 scheduled / executing / active 实验占用的 geo；DMA 实验同时计入 state 级实验（换算成 DMA）。
  - 去掉 `restrictStartDate`：错峰复用改为用更晚的 `startTime` 重新调 prepare，只释放到那天已结束实验的 geo。
  - prepare 输出由 `concurrentTestInfo` / `autoExcludedGeoCodes` 改为 `geoConstraints.occupancy`；重新出已有实验的方案时传 `liftTestGroupId`。
  - 实验级 include / exclude 只约束改动组（holdout / exposed），不再追问「整个实验都排除还是只是不放进 holdout」；账户级 Allowed / Restricted 约束两组。设计后的校验按此调整。
  - `lift-test-create` 返回 `geoConflict` 时，转述冲突实验与共享 geo，建议在 `conflictEndTime` 之后开始或用该日期重新 prepare。
  - 开始日与在跑实验重叠时不再由模型自己判断重叠：设计前作为 `startTime` 传给 prepare，设计后直接带给 `lift-test-create`；`geoConflict` 表示未保存，`conflictEndTime` 为空时只能保留日期并重新设计。
  - `geoConstraints` 为 `null`（platform-api 不可达）时，并发排除和账户级限制都没生效，Step 4 两行都要说明并建议重试；Step 4 账户行改用 prepare 返回的 `geoExclusion`（按设计粒度）。
  - 重新出已有草稿的方案时，prepare 传 `liftTestGroupId` 和草稿开始日（客户本地日期）。
  - 未填开始日期时草稿仍不填，但 `lift-test-create` 的冲突检查按保守口径（今天开始、结束无界）执行；出现 `geoConflict` 时建议定一个 `conflictEndTime` 之后的开始日或重新出方案。
  - 不带年份的日期（如「5 月 1 日」）默认今年；落在过去就按过去日期处理，不自动顺延到明年。
  - 保存方案时把它对应的 prepare `startTime` 作为 `restrictStartTime` 传给 `lift-test-create` / `lift-test-create-or-update`（新方案），存进草稿 `extraInfo`，换 session 后可读回；重出已有实验时从 `extraInfo.restrictStartTime` 读出作为 `startTime`；开始日早于它会被拒绝，需按新日期重出方案。
  **上线顺序**：须与 platform-api `geoConstraints` / `concurrentConflictCheck` 接口、platform-mcp 同名分支（workmagicio/platform-mcp#447）一起发布；单独先发会让模型调用尚不存在的参数。

## 2026-10-27（2.3.0）

### Changed

- **`lift-test-creation` 2.3.0：设计做不出来时转 Data Science 改为建 CS 任务 + Lark 群（需用户确认）。**
  solve loop 第 3 轮仍无可行设计、或 auto-solve 在边界上也无解且用户不要手动杠杆时：先给转交总结，再展示 CS 任务预览
  （标题 / 负责团队 Data Science / 优先级（默认 P0）/ 账户 / 描述 / 拉群成员），结束本轮；用户明确同意后才调 platform-mcp 的
  `cs-task-create`（`category: "Lift Test"`），只调一次，按返回的 `duplicate` / `groupError` 如实转述，群链接只在返回时给。
  用户拒绝则只留总结、不建任务。**超出 skill 能力范围的需求（创意测试、自定义 / 导入指标、非地域测试、≥6 cell）同样走预览 → 确认 → 建任务**；
  用户能自己改的产品限制（不支持的国家、过去的开始日期、未就绪的销售渠道）不转交、不建任务。
  **上线顺序**：须在 cs-support `todos-with-group`、platform-api `/cs-todo/create-with-group`、platform-mcp `cs-task-create`
  全部部署之后再发布本条。
- **2.3.0 合入时补充（2026-10-27 端到端测试反馈）**：CS 任务预览的描述一栏放实际提交的描述原文，不再写「见上面的总结」；建完任务后回复里除群链接外，再给 CRM ticket 链接（返回 `taskUrl` 时用它，否则用 `todoId` 拼 `https://crm.workmagic.io/csm-workspace?task=<todoId>`，只在返回了 `todoId` 时给）。rebase 到 2.2.8：保留 2.2.4–2.2.8 的全部改动，Step 7 仍直接接 Step 8 的 design deck。

## 2026-10-27（2.2.8）

### Fixed

- **`lift-test-creation` 2.2.8：design 表的实验组名单写明从哪个字段读，修正 Holdout / Reference 写反。**
  2026-10-27 端到端测试（Chirp 150968，PTM）里，Step 5 的 design 表把 Reference group 的 12 个 DMA 列成了 Holdout group，真正暂停 Meta 的 16 个 DMA（含 Atlanta、Miami）反而没列出来；占比 5.82% 是对的，所以同一行里的占比和 DMA 个数来自两边。根因：output-templates.md 只要求「实验组按名字列出」，没写读哪个字段，正确的侧别映射只在 create-update-params.md 里。
  ① output-templates.md Step 5：新增「每行从哪个字段读」表——占比读 `cell_order_share_pct[i]`，个数和名单读 `geo_group.control[i]`，Reference group 只报 `geo_group.test` 的个数和占比；发送前核对个数等于 `control[i].name` 的长度（列出的名字加「+ N more」），个数、名单、占比同出一侧；地区名用「 · 」分隔（DMA 名自带逗号）。
  ② Reference group 改称「design 选出的匹配地区」，不再写成「剩下的所有 DMA」（output-templates.md 示例与规则、constraints.md、failure-modes.md）；failure-modes.md 新增「把 `geo_group.test` 当实验组」一条。
  ③ SKILL.md 的 design 表要求补一句侧别提示。只改文案，不改工具调用。

## 2026-10-27（2.2.7）

### Changed

- **`lift-test-creation` 2.2.7：新实验不继承旧设置、Step 4 不许跳；CPA 不合理时先请用户确认。**
  ① 新增 CRITICAL rule 9：每个新实验都从 Step 1 开始。对话里之前的实验、粘贴的 Slack / Lark 讨论、草稿或设计链接都只是背景；平台、test level、目标、cell 结构、geo size、时长、方法、CPA 只有出现在新的 Step 4 表里并被用户确认，才算数。把一个多 cell 实验拆成几个（如 3-cell 拆成两个并行 2-cell）、合并、按新需求重设计，都算新实验，各自走 Step 3–7。只有用户点名改已有草稿时才走 update。
  ② Step 4 永不跳过（用户说「没有别的了」、或者旧实验似乎已经给齐信息，都不是跳过的理由）；scope 行按 cell 写出 test level，用户没说 level 就在这里问——prepare 会静默默认 tactic；Default tactic（`tacticNames: ['']`）写成「Default tactic」，不写「(none)」。
  ③ CPA 合理性检查：设计回来后，任一平台 CPA 低于 $10 / 转化，或 CPA 存在但门槛落在平台最低花费，就在设计确认那句里请用户确认 CPA 或给出自己的 CPA；确认即建草稿，给新 CPA 就重跑 analyze（不重新设计）再确认。不拦截——真实的低 CPA 存在。auto-solve 遇到这种 CPA 先确认再搜索。
  来源：Amy 10/22（3-cell 拆成两个 2-cell 时沿用了 tactic level、跳过 Step 4）与 10/23（CPA 与门槛）两条反馈；Xiaojun 10/26「200 是兜底，可在此基础上加一层 CPA 合理性判断」。

## 2026-10-26（2.2.6）

### Changed

- **`lift-test-creation` 2.2.6：新建草稿后自动接 design deck，删草稿时把 deck 一起移到 Drive 回收站。**
  这个 skill 从 2026-10-26 起统一在 Claude（Claude Code / Cowork）里用，deck skill 在那里可用，所以 Step 8 从「用户要了才做」改成流程的一部分：
  Step 7 建完草稿，同一轮直接按 cell 数调 2-cell-test-design-deck / multicell-design-deck，不再单独问；用户明说「先不要 deck」才跳过。
  design 确认门的那次 yes 同时覆盖草稿和 deck。更新草稿只在改动影响 deck 内容时重做 deck。
  通过本 skill 删草稿时，在客户 Lift Test Design 文件夹里按 test id 找到对应 deck，列进删除确认，确认后移到 Drive 回收站（不永久删除）；在产品 UI 里删的草稿本 skill 感知不到。
  Justin AI 等跑不了本地 skill 的入口：明说 deck 要在 Claude 里做，给草稿链接。
  **依赖：** 「落到 Drive」由 deck skill 负责；2-cell-test-design-deck 目前写的是「CSM 自己上传、skill 不上传」，在它支持上传之前，这里会给出本地文件和目标文件夹并说明还没上传。

## 2026-10-26（2.2.5）

### Fixed

- **`lift-test-creation` 2.2.5：DS 验收 issue tracker 后剩下的 5 处文案护栏（只改 skill 文本，不改工具调用）。**
  ① sop-detail.md + constraints.md：写明 prepare 只对**同 geo level** 的并发测试自动排除，跨层级（如 state 级设计遇到 DMA 级 running test）要在 Step 4 明说并给手动排除 / 顺延两条路（tracker #12 的文本兜底，根治在 prepare）。
  ② sop-detail.md Step 5：新增引擎 `data_gate` 一行——不是 solve loop 能修的失败，常见原因是单 geo 订单占比 > 30%（fit 窗口 121 天），转 DS、不重试（#16）。
  ③ failure-modes.md：平台拒绝同轮重复 design-result 时只报进度继续轮询，禁止重新提交 design 或改派后台任务（#3）；展示设计时不讲 setup 方式（#5）；不转述 analyze 的「什么时候开始」追问（#7）；门槛落到下限且无 CPA 时回推出的 `expect_cpa` 不得当成本给用户（#24，承接 2.2.2 的下限说明）。
  2.2.2 / 2.2.3 已覆盖的别名、custom 渠道、solve loop 改周期、Step 8 精简不再重复。

## 2026-10-26（2.2.4）

### Fixed

- **`lift-test-creation` 2.2.4：纠正 `create-update-params.md` 里关于 readout 侧别的说明。** 2.2.1 写的是「readout 结果字段
  按统计惯例，`test_orders` = 被处理组」，与数据相反：`lift-test-readout` 的 `ctrl_orders` 才是被处理组（Holdout / Exposed group），
  `test_orders` 是 Reference group，和草稿 `geoGroup` 模型同一套映射。2026-10-26 在三个已完成测试上核实（2795 PTM、2442 PTM、
  1908 LTM）：`test_orders ÷ ctrl_orders` 等于设计里 Reference 占比 ÷ 被处理组占比，`ctrl_orders` 按天折算等于设计的
  `shopify_daily_control_orders`。`lift-test-readout` 的 `references/terminology.md` 同步改正（原写「counterfactual / treatment-side」）。

## 2026-10-26（2.2.3）

### Changed

- **`lift-test-creation` 2.2.3：可行性门槛改读 `minimum_daily_budget_required`，不再用 `expected_daily_spend`。**
  配合 platform-mcp 门槛统一计算（analyze / create / create-or-update 共用一个与前端一致的函数）。门槛 = analyze 每个平台的
  `estimator.channel[i][j].minimum_daily_budget_required`（设计周期 D = `geo_group.estimator.experiment_days`），其他周期按
  × √(D/N) 换算，多平台逐个展示、全部达标才算充足；auto-solve 换算基准改用 D（不再写死 21，搜索提交的 21 天不变）。
  改周期 / 换方法 / 改 CPA 时只改输入，每 cell 派生的 `expect_cpa` / `minimum_daily_budget_required` 由 create-or-update 保存时重算，
  skill 不再手算或手改；`custom_test_length` 由工具自动对齐。**须在 platform-mcp 该改动部署后发布。**
  另：Step 8 只保留「何时生成 deck、按 cell 数调哪个 deck skill、回复链接、不把 deck 内容抄回对话」，deck 的页面、数字（含 MDL）、
  文件结构等细节交给 deck skill 定义，不再在本 skill 重复（原文曾误称 MDL 随测试周期变化，MDL 只取决于设计）。
  另：solve loop 杠杆表纠正两行「要重新设计」——延长测试周期改为按公式 × √(D/N) 重选（设计引擎没有周期输入）；换方法优先用同一次
  设计里另一种方法的结果，没有时把当前设计按另一种方法跑：skill 按目标方法公式自算门槛、给用户确认后再建（create / create-or-update 保存时按同一公式重算）。
  另：补平台别名（ChatGPT / OpenAI、AppLovin、Reddit、Roku、MNTN、TikTok GMV Max），以 scan 的平台列表为准；写明 custom / imported
  销售渠道可正常测试、§3 的「imported / offline feed」只针对指标定义；销售渠道直接用 scan 的 `salesChannel`（已按 lift test 就绪过滤），
  不在其中即未就绪，引导去数据健康 / Settings 页查原因。

## 2026-10-26

### Fixed

- **`lift-test-creation`：测试结束日期对齐前端（闭区间，少算的那一天）。**
  配合 platform-mcp 的结束日期修正：`lift-test-create` 不传 `testEndTime` 时按前端算法算
  `开始日 + test_length + cooling_length − 1`（开始当天算第 1 天，冷却期读 `geoGroup.cooling_length`、缺省 7，按客户时区的本地日期），
  不再是原来的 `+ test_length + 7`（多一天、冷却写死 7）；`lift-test-create-or-update` 在开始时间 / 测试周期 / 冷却期变化且 body
  不带 `testEndTime` 时自动重算。skill 侧：`create-update-params.md` 的 `testEndTime` 行改成前端算法；`sop-detail.md`
  的直接编辑路径说明结束日期由工具重算、agent 不手算，推回 body 时去掉 `testEndTime`，只有用户明确指定结束日期才保留。
  **上线顺序**：须在 platform-mcp 该修正部署之后发布（旧版 create-or-update 不会重算，按新文案去掉 `testEndTime` 会留下旧的结束日期）。

- **`lift-test-creation` 2.2.2：门槛落到下限、缺 CPA / 缺花费时如实告诉用户，不再当成「充足」。**
  配合 platform-mcp 的 `lift-test-design-analyze` 修正（只传 CPA 也查 7 天花费、30 天 CPA 不依赖 7 天花费、
  `origin_*` 永远是平台值、缺值输出 `null`、新增 `threshold_at_floor`）。skill 侧：Step 5 写 ✓ / ✗ 前先读
  estimator：`cpa` 或 `ads_daily_reported_spend` 为 null 时写「未检查」及原因；`threshold_at_floor` 为 true 时说明门槛是
  平台最低花费、不是按 CPA 算的。并纠正 `auto-solve.md` 里「看到 $200 门槛说明真实需求低于 $200」的错误推论（缺 CPA 时同样是 $200）。
  **上线顺序**：须在 platform-mcp 该修正部署之后发布。

## 2026-10-21

### Fixed

- **`lift-test-creation` 2.2.1：纠正 `create-update-params.md` 里 test / control 侧别写反的三行。**
  原文把 `geoGroup.test` 写成 treatment side、`testGeo` 写成 treatment-side codes、`controlGeo` 写成 reference-side codes。
  平台 `lift_test_group` 的实际语义相反：`control` = 被处理的 cell（PTM 的 Holdout group / LTM 的 Exposed group），
  `test` = Reference group（多 cell 时跨 cell 共享）。用三个草稿（手工 PTM、在线 PTM、在线 LTM）的产品 setup 页逐一核对
  （Holdout / Exposed group 显示的 DMA 数与订单占比全部等于 `control` 侧；多 cell 设计的 `test` 侧跨 cell 完全相同），并与 `lift-test-design-analyze`
  （`order_share_pct` = control 侧占比）、`lift-test-create`（`holdout_pct` = control group 比例）一致。
  同时在 `geoGroup` 一节加了一条「按字段不按字面」的侧别说明，要求 Step 5 表和交接里的 treatment geo
  名单与个数一律取自 `geoGroup.control[cell]`，并注明该映射只适用于草稿 / `geoGroup` 模型，readout 结果字段（`test_orders` / `ctrl_orders`）仍是统计惯例。
  **为什么要改**：实跑中 Justin 按工具描述报占比时是对的，但一旦照本文件列 treatment DMA 名单就会列成 reference 侧；
  审计报告里一条 P0 也是照旧文误判后撤回的。仅改文案，不改流程与工具调用。

## 2026-10-16

### Changed

- **`lift-test-creation` 2.2.0：对齐 platform-mcp 按 cell 分组的 `testChannel`（v2 线）。**
  `lift-test-design-prepare` 改收按 cell 分组的 `testChannel`（二维数组：外层 = test cell，内层 = 该 cell 的平台条目
  `{adPlatform, impactCampaignInfos}`），由 prepare 推导 numberOfCells / testChannelIndex / extraInfo。skill 同步：
  一个 cell = 一个 lift 结果、未说分组默认每样一个 cell、用户说「一起」才合进同一 cell；prepare 挪到 Step 3（Step 4
  确认前），并发测试地域的自动排除由 prepare 完成，「推迟到对方结束后复用地域」= `restrictStartDate: true`；
  加大 geo size 只改 scan 结果的 `suggested.holdout_pct`；支持 8 国（英国传 `GB`），非 US 只支持 postcode；
  Amazon Ads 不支持；没有可选目标的平台以 `[]` 存为 skip for now。
  **未改**：「只给 cell 数」入口原样保留——当前 prepare 要求每个 cell 至少带一个平台，这条入口暂时跑不通，待 MCP 支持后再议。
  **上线顺序**：必须在 platform-mcp 的 testChannel 按 cell 分组改动部署之后再发布本条。

## 2026-09-30

### Changed

- **`lift-test-creation` 回退到 1.1.0（2026-09-23 版）。** 2026-09-29 经
  [#44](https://github.com/workmagicio/skills/pull/44) 上线的 v2.1.0 重写（双入口 + 约束求解 +
  auto-solve）整体撤回，10 个文件逐字节还原到 #44 合入前的 `84a8241`。v2 内容仍保留在
  `feature-lift-test-creation` 分支与 platform-mcp 的 `doc/skills/lift-test-creation-v2.md`，
  修订后再重新合入。采用正向还原而非改写 master 历史，#43 不受影响。

## 2026-09-28

### Changed

- **`attribution-custom-dimension` 1.2.1：读分隔符改调 `naming-convention-separators-get`。**
  platform-mcp 把读写合一的 `naming-convention-separators`（不传 `separators` 是读、传了是覆盖写）拆成
  `-get`（只读）/ `-set`（[workmagicio/platform-mcp#360](https://github.com/workmagicio/platform-mcp/pull/360)），
  旧名双注册弃用、sunset 2026-12-07。这个 skill 只在 State C 读分隔符，4 处全部是读取用法，全部改成 `-get`。
  **为什么要改**：Justin 对 WorkMagic 工具按工具级 `readOnlyHint` 定风险等级、不看入参，读写合一的旧名
  只能标非只读，于是「先读一下分隔符」也要用户点确认——在会话挂起式的界面里用户直接拿不到回答。
  **上线顺序**：必须在 #360 部署之后再发布本条，否则新名在服务端还不存在。

## 2026-09-23

### Changed

- **全部 13 个 skill：正文按「每轮都要在场 / 只在某个分支才要」重切，合计 165,283 → 151,693 字符（−8.2%）。**
  skill 正文在被 enable 之后**整篇**进对话，并在该会话后续**每一次**模型调用里重复计费；`references/`
  只被列成一行索引，模型显式取用才拉。据此删掉三类内容：① `When to trigger` 里的**正向触发例句**
  —— skill 被 enable 的那一刻路由已经发生，这些例句之后一个字都用不上；② 只在某个分支才用得到的长块；
  ③ 与另一处正文或自己的 reference **逐字重复**的段落。
  **反向路由（"Do NOT trigger → 改用 X skill"）、约束白名单、必填与默认值、CRITICAL rules、SOP 步骤骨架
  一律保留** —— 执行到一半才发现该换 skill 时要靠它们。全程只做「整段删 / 整段逐字移 + 留指针」，
  没有重述任何一条规则。
  单个降幅：`mbo-create-scenario` −20.5%（SOP 9,825 → ~6,000）、`attribution-model-comparison` −14.1%、
  `mbo-read-scenario` −12.8%、`media-buyer-read` −9.9%、`lift-test-creation` −9.3%。

- **13 条 frontmatter `description` 压缩：3,902 → 2,914 字符（−988）。**
  `description` 是唯一**每一轮**都在宿主系统 prompt 里的部分，且是**全部 skill 一起**列出，所以它只该回答
  「该不该启用我」——触发词 + 反向路由，方法论归正文（正文本来就是「答案是该」之后才加载的）。
  压得最多的是 `attribution-weekly-report`（559 → 285）与 `media-buyer-input-capture`（446 → 288）。
  **反向修了一条**：`lift-test-creation` 原本只有 67 字符、连 geo test / holdout / incrementality 这些
  触发词都没有，是**漏召**风险，已加长到 241。

- **`media-buyer-read` / `media-buyer-input-capture` 首次有了 `references/`。**
  这两个此前是全仓仅有的单文件 skill（合计 45.5K 字符、0% 按需加载）。拆出
  `media-buyer-read/references/engine-words.md`（引擎原话不可转述时怎么办）与
  `media-buyer-input-capture/references/rejections.md`（工具拒绝时按「是谁的问题」分类处理），
  正文各留一段「什么时候去读它 + 那条不可协商的判据」。

- **两处「拆了没搬」补上**：`lift-test-creation` 的逐字段解析规则并入既有
  `references/input-parsing.md`（正文只留字段 / 必填 / 默认值表）；`attribution-model-comparison`
  的 `## 6. Output format` 并入既有 `references/output-template.md`。
  **`country` 的 7 国白名单在复核时被搬回正文** —— 那是每轮都要拿来判断的校验约束，
  放进 reference 等于赌模型会先去读。

### Known issues

- **`lift-test-diagnosis` 这个 skill 从不存在，却有 4 条路由指向它**（`lift-test-readout` 与
  `lift-test-creation` 各两处：反向路由表 + Related skills 表）。`git log --all` 零命中。
  后果是「我的测试失败了怎么办 / 为什么 inconclusive」会被路由到一个不存在的 skill。
  需要决定补建它还是改指向。本次未动。
- **`lift-test-creation` 的国家白名单自相矛盾**：写的是 "Only **7 countries supported**:
  US / AU / CA / FR / DE / UK" —— 只列了 6 个。此问题早于本次改动。

## 2026-09-17 (3)

### Changed

- **`attribution-weekly-report` (2.2.1 → 2.2.2)：step 4 改为「两个窗口的查询一次发完」。**
  实测一轮（Justin session 19296）把 8 条查询拆成 3 条消息发，多出的两次模型往返净耗
  **25.4 秒**——而这些查询彼此独立、宿主本就并行执行。看板恒定要跟上一周期比，
  所以「先探当期、再看要不要探上期」是明知故问，现明令两窗口同批发出。

## 2026-09-17 (later)

### Changed

- **`attribution-weekly-report` (2.2.0 → 2.2.1)：`instantiation.md` 直接给出每个编辑点的
  `old_string` 原文。** 2.2.0 让宿主实例化模板后，实测一轮（Justin session 19287）仍花了
  **11 次 `bt-artifact-read`** 去逐个查找「要改的那一行现在长什么样」——每次都是一轮完整往返。
  锚串本来就是固定的，写进文档即可省掉这一整段：现按编辑点列成表，并写明「匹配不上再回读那一条」。

## 2026-09-17

### Changed

- **`attribution-weekly-report` (2.1.1 → 2.2.0): 看板改为「宿主实例化模板 + 小改」，不再由模型复述骨架。**
  Justin 平台给 `bt-artifact-manage` 加了 `template: {skill, file}`：保存时由**服务端**把 skill 里的
  `templates/board.tsx`（77k 字符）原样写进 artifact，模型既不读回、也不重打。SOP step 5 与
  `references/instantiation.md` 相应改写——先实例化，再用 `action='edit'` 逐处替换
  （`ACCOUNT` / `PERIOD` / seed / `PLAT_LABEL`…）。

  **为什么改**：线上一轮实测（2026-09-17），模型分 3 页读完模板（85k 字符进上下文），再花 4 次生成、
  52k output token、480 秒手打出一个 22.6k 字符的缩水版——占该 13 分钟 turn 的 61%，而骨架本就躺在磁盘上。
  本文档此前已写「should not be rewritten」，但那只是劝告；现在有机制承载。

- **取数从 5 次往返压到 1 次。** step 3 的 `database-query-ask` 由 **MANDATORY** 改为**仅在探测报
  schema 错时才调**（四条 SQL 模板本身就是确认过的 schema，`ctx` 约定写在 SOP 里）；step 4 要求把四条
  board 查询**放在同一条消息里发**，它们相互独立、并行执行，一次往返即可。

- **自检不再包含截图。** 宿主已把「截图自己的作品」默认关闭（`bt-artifact-capture` 仅用于用户
  索要的图片），故 step 6 与 `instantiation.md` 的 self-review 明确写成**代码 + 数据**核对。

## 2026-09-14

### Changed

- **跟随平台的工具名 kebab 化（`attribution-weekly-report` 2.1.1 · `media-buyer-input-capture` 1.0.1 ·
  `media-buyer-read` 1.1.1）。** Justin 平台把**自有**工具名从下划线统一成中划线
  （`bt_artifact_manage` → `bt-artifact-manage`、`wm_media-buyer-input-create` →
  `wm-media-buyer-input-create`）。本次把这三个 skill 里的 7 处引用同步过去：**2 行 frontmatter `requires:` 门（共 3 个工具名）**
  + **4 处正文指令**（正文会注入 prompt，模型会照着念名字）。

  **行为没有任何变化**，纯粹是跟随上游重命名。上游 leaf 原样不动
  （`media-buyer-input-create` 本来就是连字符），改的只有我方前缀那一段。

  **两仓不必同时合并**：平台侧的 `requires` 匹配器已改成折叠匹配（`wm_x` 与 `wm-x` 等价），
  所以本 PR 与平台 PR 任意顺序落地都不会出现「skill 被判工具缺失而静默关闭」的窗口期。

## 2026-08-28 (later)
### Changed
- **`attribution-weekly-report` (2.0.0 → 2.1.0): the two per-cadence behaviours that were
  documented-but-unimplemented are now shipped, and both are config rather than a code fork.**

  **Trailing-window baseline (`baselineDays`).** A daily board now compares against the
  **trailing 7 days**, not against yesterday. Day-over-day is day-of-week rhythm rather than
  signal — measured on a real account at spend +40.7% / sales −10.3% / ROAS −36.3% between two
  adjacent days with nothing having changed. Levels are scaled to the current window's length
  (×1/7 for daily) so a 1-day figure is never held against a 7-day total; rates are not
  scaled and need none, because multiplying spend and revenue by the same factor leaves ROAS
  untouched — ratio-of-sums still holds exactly. Note this **revises** the earlier spec, which
  called for a trailing 7-day *median*: seven consecutive days already contain each weekday
  once, so their aggregate is deseasonalised without a median, and a median of daily ratios
  would have broken the ratio-of-sums law for every rate on the board.

  **Calendar alignment (`align: "calendar"` + `unit`).** Monthly and quarterly boards now use
  real calendar periods instead of a rolling 30 / 91 days, which is what finance reports on.
  A complete period is compared as raw totals (February's 28 days against January's 31 — the
  convention), with both day counts stated on the page rather than normalised away silently.
  An incomplete period is reported **period-to-date against the same number of days into the
  prior period** — Mar 1–4 against Feb 1–4, never against all of February. Trend buckets
  become real calendar periods, with a partial newest bucket when to-date.

  **Both bases are stated on the page.** Normalisation and to-date switching are correct and
  invisible, which is its own failure mode, so the status strip now carries the basis
  ("Against the trailing 7 days, on a 1-day basis" / "Monthly to date — 4 of 31 days, against
  the same 4 days of the prior month" / "Whole-month totals — 28 days vs 31 in the prior
  month, compared as-is"). Recorded as a failure mode so the chip is not tidied away.

- **Documented the board's naming divergence from the query tool's label dictionary.** The
  tool returns `meta.field_labels` and asks callers to use it verbatim; the board does not,
  and `board-spine.md` now carries the crosswalk and the reason. Adopting WM's labels verbatim
  would give the board two different axes both called "channel" (`sales_platform` → "Sales
  channel", `src_channel` → "Channel") and both attributed and store-actual revenue called
  "Sales", separated only by an "(All)" that means *all sales platforms* rather than *all
  revenue*. The crosswalk lets a customer reconcile a board figure against the WorkMagic UI.
  🔴 Flagged as **open with the WM side** rather than settled: if WM's vocabulary is the one
  customers should learn, the terms must change here *and* in the canonical scope file
  together, never only on the board.

## 2026-08-28
### Changed
- **`attribution-weekly-report` (1.2.0 → 2.0.0): the board is now the deliverable, the
  schedule is optional, and every cadence has its own board spec.** Three changes, one skill.

  **(a) A schedule is no longer required to be in scope.** "Give me a page I can check every
  Monday" used to fall between two skills: this one demanded a scheduled task, and the
  `dashboard` skill had no domain knowledge of what belongs on an attribution review board.
  The SOP now builds the board first and *asks once* whether to also push a snapshot —
  answering "no" is the common case, not a routing failure.

  **(b) The board's domain layer moved in.** The four warehouse queries, the settled-window
  rule, the five-part decision spec, the instantiation checklist and a working board
  skeleton (`templates/board.tsx`) now live here rather than being re-derived per board.
  Content is split so it cannot fork: `references/board-spine.md` holds what every cadence
  guarantees; each cadence file holds only its deltas.

  **(c) Per-cadence board specs.** `board-daily.md` / `board-weekly.md` / `board-monthly.md`
  / `board-quarterly.md`, plus `board-alert.md` which explains why an alert is *not* a board.
  The skeleton is parameterised by a single `PERIOD` block and ships configured for weekly —
  the one cadence whose numbers are verified end to end. What changes per cadence is not just
  the window: daily must compare against a **trailing 7-day median** (day-over-day is
  day-of-week seasonality, not signal — measured on a real account at spend +40.7% / sales
  −10.3% / ROAS −36.3% between two adjacent days, with nothing having changed) and may not
  recommend budget actions at all; monthly and quarterly add year-over-year and a
  calendar-alignment rule; dead bands widen for daily and tighten for quarterly. Both the
  trailing baseline and calendar alignment are documented **code changes, not settings** —
  a `baseline` config field was drafted and removed once it was clear nothing read it, since
  a silently-ignored knob is worse than none.

  Three defects found while generalising and then verifying against a real account. (1) The
  settling walk's lower bound was tied to the period length, which skipped trimming entirely
  on any account with less history than one period and put a still-ingesting day at the end
  of the window. (2) A window longer than the account's history counted missing days as zero,
  reading as a collapse; it now surfaces a "history starts <date>" warning. (3) The trim test
  looked only at revenue-vs-median, so a trailing day whose spend was fully recorded but
  whose attribution was still arriving passed it — measured on a real account at 89.7% of
  median revenue but only 70.2% of median ROAS on 128.6% of median spend. That day is now
  **flagged, deliberately not trimmed**: a ROAS-based trim cannot distinguish a still-settling
  day from a genuinely bad one, and silently hiding the latter is the one thing this board
  must not do. (4) The Part 4 footnote claimed the funnel ties to the Part 1 headline "within
  0.1%"; on a real account the gap is **1.95% of revenue**, because Part 4 reads the ad-level
  view and Part 1 the channel-level one, and attributed revenue with no resolvable ad has no
  ad-level row. The board now **computes and states the coverage it achieved** rather than
  asserting a magnitude that goes stale.

  Verified against a real account end to end (four queries, both settled windows): SQL needs
  no `tenant_id` filter, numeric cells arrive as strings, the attribution model resolves
  live, `tactic_name` really does carry `""` / `"-1"`, a third of ad-level rows are all-zero,
  a marketplace reporting five days behind triggers the late-platform notice, a null sales
  value and a zero-spend-with-revenue row both degrade correctly, and the material-spend
  floor scales with the account (1% of a real week's spend, versus a fixed dollar amount that
  would have emptied Parts 3 and 5).

  The board skeleton ships a deliberately synthetic seed that **must** be replaced with
  probed values at instantiation: a seed carrying a real account's figures renders as another
  account's data anywhere the live bridge is inert.
### Fixed
- README catalog still linked `attribution-custom-report`, removed on 2026-08-19 — dangling
  link dropped.

## 2026-08-19
### Removed
- **`attribution-custom-report`** — the skill that built a **native platform** custom dashboard
  (via `wms_dashboard-create`). We no longer build native custom dashboards; "create / build a
  dashboard" now routes to the **`dashboard` skill** (a live-data html/react **artifact** — richer,
  self-refreshing, and it inherits the measurement-identity/sales-platform-scope rules). Routing
  pointers in `attribution-data-query` and `attribution-weekly-report` updated accordingly.

### Changed
- **Single source of truth for shared attribution conventions.** `attribution-data-query`'s
  `references/attribution-model.md` (model default + aliases) and `references/sales-platform-scope.md`
  (sales-platform scope + measurement identity) are now marked **canonical** — other attribution
  skills point here (via `skills_read`) instead of keeping divergent copies (the drift/contradiction
  source found in review). New `scripts/check-shared-conventions.mjs` drift guard (no CI in this
  repo — run before pushing): asserts the canonical markers exist and no SQL template regresses to
  the Shopify-only default measure.
- **`attribution-data-query` (1.2.0 → 1.3.0): report-shaped results become a live artifact.** A
  single number / tiny table still answers in chat; a breakdown / trend / multi-platform / comparison
  now builds a live-data dashboard **artifact** (the `dashboard` skill) carrying the measurement
  identity — not a wall of table dumped in chat.
- **Reports now produce good-looking artifacts (family-wide output upgrade).** The house rule:
  simple pull → chat; anything report-shaped → a beautiful artifact (live where it queries data,
  static HTML where it's a point-in-time narrative). Each of these also drops its duplicated
  conventions in favor of the canonical pointer above:
  - `attribution-weekly-report` (1.1.0 → 1.2.0): the recurring view is now a **live dashboard** built
    first; the schedule pushes an optional snapshot (in-app/Slack link + digest, or an email
    HTML/PDF snapshot + link) — asked as one question, not assumed.
  - `attribution-model-comparison` (1.0.0 → 1.1.0): a multi-model comparison is a **live Comparison
    artifact** (grouped bars × model + the diff-pattern "why they differ" readout), per sales
    platform; a 1-channel check may stay a chat table.
  - `attribution-anomaly-diagnosis` (1.0.0 → 1.1.0): a diagnosis is a **static HTML artifact** (a
    shareable page: What/Why/What-to-do + one anomaly visual), kept static because it's a
    point-in-time explanation.
  - `attribution-custom-dimension` (1.0.0 → 1.1.0): its delegated answer inherits the data-query
    threshold, so a "by <label>" breakdown comes back as an artifact.
  - **Reference/template deep-adaptation** (not just skill bodies): `model-comparison` and
    `anomaly-diagnosis` `output-template.md` rewritten from "chat table / markdown report" to the
    **artifact spec** (Comparison-artifact layout; static HTML diagnosis-page structure);
    `weekly-report` `output-template.md` reframed so the live dashboard is the primary view and the
    markdown templates are the channel-sized **snapshot** (digest+link / email HTML+PDF+link).
  - `attribution-edge-routing` (1.0.0 → 1.0.1) and `attribution-intent-clarification` (1.0.0 → 1.0.1):
    added the canonical-conventions pointer; noted the 7-day-vs-30-day window default is
    task-specific (not a contradiction) and that "build a dashboard" routes to the `dashboard` skill.

## 2026-08-14
### Changed
- **Sales-platform scope is now a first-class part of the measurement identity.** Every attribution
  number states BOTH the **sales-platform scope** and the **attribution model** — the two together
  are what make a figure interpretable (a "$3.87M" reads very differently as all-platform vs
  Shopify-only). New reference `attribution-data-query/references/sales-platform-scope.md`: the
  always-label **law**, the **scoped default** (totals / business overview → all sales platforms
  `attr_all_*`; per-sales-platform model comparison & anomaly diagnosis stay **per platform** on
  purpose, because model validity differs by platform), per-platform breakdown via dedicated
  measures, "Other marketplaces" for platforms without a dedicated measure, no `sales_platform`
  dimension on the attribution dataset, and spend never split by sales platform.
  - `attribution-data-query` (1.1.0 → **1.2.0**): SQL templates/examples default `attr_all_sales`;
    SKILL states scope + model in the source citation; worked example carries the scope label.
  - `attribution-weekly-report` (1.0.0 → **1.1.0**): metrics template uses `attr_all_sales`, and the
    report header + footer now carry `Sales platforms: {sales_scope}` alongside the model — closing
    the gap where all-platform revenue/ROAS shipped to a CMO labeled with the model only.
  - Unchanged on purpose: `attribution-model-comparison` and `attribution-anomaly-diagnosis` stay
    **per sales platform** (model validity differs by platform). Follow-up: their output-scope
    labeling standardization, and the remaining skills' provenance lines.

## 2026-07-14
### Added
- **`npx skills` distribution** — one-command install/update across Claude Code, Codex, Cursor,
  Gemini CLI, and 70+ agents.
- **Claude Code plugin marketplace** (`.claude-plugin/marketplace.json`) — `/plugin marketplace add workmagicio/skills`.
- This changelog.

### Skill versions (current)
| Skill | Version |
| --- | --- |
| attribution-data-query | 1.3.0 |
| attribution-anomaly-diagnosis | 1.1.0 |
| attribution-custom-dimension | 1.1.0 |
| attribution-edge-routing | 1.0.1 |
| attribution-intent-clarification | 1.0.1 |
| attribution-model-comparison | 1.1.0 |
| attribution-weekly-report | 1.2.0 |
| lift-test-creation | 1.0.0 |
| lift-test-readout | 1.0.0 |
| mbo-create-scenario | 1.0.0 |
| mbo-read-scenario | 1.0.0 |
