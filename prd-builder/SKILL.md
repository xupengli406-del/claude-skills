---
name: prd-builder
description: >-
  Builds a research-and-development-executable Chinese PRD from an existing
  demo codebase, in the user's signature 9-section structure (版本/变更日志/
  文档说明/需求背景/需求范围/功能详细/系统架构/用户旅程/非功能/埋点/项目规划). Use when
  the user mentions PRD, 写 PRD, 出 PRD, 评审稿, 研发可执行 PRD, 把 demo 转成 PRD,
  把这个项目沉淀成 PRD, or attaches/refers to a code repository asking for
  a Feishu/Markdown product spec.
---

# prd-builder

Sustains the user's signature **R&D-executable PRD** as a reproducible
output. Given any demo-stage codebase (or design + code combo), this skill
reverse-mines the modules, fills the locked 9-section skeleton, and emits
a Feishu-compatible markdown that engineers can pick up and ship.

## Why this skill exists

The user already has one PRD that engineering accepted as "可执行"
(`短剧产品v1_PRD_研发可执行文档`). The structure, density, and visual
grammar of that document are now the **template**. This skill rebuilds
that exact contract from any new demo, so the user never has to re-invent
the format.

## Trigger scenarios

Apply this skill when the user asks to:

- Convert a demo / prototype / hackathon codebase into a formal PRD.
- Refresh an existing PRD with a new sub-version (e.g. v1.1 → v1.2 increment).
- Add a new module / feature point to an in-flight PRD.
- Reverse-document a feature the engineering team built ad-hoc.
- Output a Feishu-pasteable markdown for design review / engineering kickoff.

If the user attaches an existing PRD, treat it as the **base** and do an
incremental update following [changelog-convention.md](changelog-convention.md).
Otherwise build from [templates/prd.md](templates/prd.md) starting from scratch.

## Five-stage workflow

```
- [ ] 1. Mine     — scan the codebase, list modules / routes / components / stores
- [ ] 2. Outline  — fill the 9-section skeleton with module list (no detail yet)
- [ ] 3. Detail   — write each "功能点 X.Y" using the locked grid template
- [ ] 4. System   — draw ASCII flow diagrams for cross-module data流转
- [ ] 5. Polish   — changelog + 红字标注 + name normalization + Feishu paste check
```

### Stage 1 — Mine

Goal: build a **module × functional-point inventory** from the codebase before writing a single line of PRD prose.

- Read `package.json`, `vite.config.*`, router configuration, `src/pages/` or `src/routes/`, `src/components/`, `src/store/`, `src/constants/pricing.*`.
- Run `node scripts/scan_codebase.mjs <repo_path>` to dump a JSON inventory (routes, modal components, store slices, pricing/billing files).
- Identify the **5–8 top-level modules** along the user's path:
  `登录 → 工作区 → 创作（图片/视频）→ 文件管理 → 计费`.
  This module ordering is the user's PRD signature; preserve it.
- For each module, list candidate **功能点**: every modal, every dialog, every interactive section becomes one 功能点. Aim for 4–8 功能点 per module.

Output of this stage: a flat tree like:

```
模块 1：账户系统
  1.1 登录弹窗
  1.2 用户菜单与注销
  1.3 ...
模块 2：工作区框架
  2.1 整体布局
  ...
```

Confirm this tree with the user before writing details. Wrong module split = wasted detail writing.

### Stage 2 — Outline

Open [templates/prd.md](templates/prd.md). Fill in:

- 一、版本信息（版本号 / 创建日期 / 审核人）
- 二、变更日志（新建项目时只放一行；增量更新时按 [changelog-convention.md](changelog-convention.md) 追加红字 lark-table）
- 三、名词解释（仅放业务术语；技术术语放在功能点正文里）
- 四、需求背景（拉用户调研 / 竞品分析的飞书文档 token 占位，等用户后续补）
- 五、需求范围 → 模块总览（按 Stage 1 的模块清单填表，每行附 Demo 实现状态）

Submit this outline to user for sign-off.

### Stage 3 — Detail

For each 功能点 X.Y, fill [templates/feature-point.md](templates/feature-point.md) into 六、功能详细说明。Follow [feature-point-template.md](feature-point-template.md) strictly:

- 左 40% 列写 **页面/交互**（触发方式 / 形态尺寸 / 元素清单 / 子视图）
- 右 60% 列写 **截图占位**（`<image token="待补" align="center"/>`）
- grid 下方写 **规则**（业务规则 / 状态机 / 边界 / Mock 标记 / 第三方对接）
- 章节末用 `---` 分隔下一个功能点

每个功能点必须给出：
1. 触发方式（点击 X 按钮 / URL 进入 / 状态变化）
2. UI 尺寸具体到 px（420px / 高 44px / 圆角 12px / #5865F2）
3. Demo 实现状态（已完成 / Mock / 模拟态 / 待实现）
4. 至少一条「异常 / 兜底」规则

### Stage 4 — System

写 **六（附）系统架构与核心数据流转** + **六（附二）用户旅程图**：

- 节点说明用 lark-table（节点 / 类型 / 职责 三列）。
- 流程用 ASCII art 画 **plaintext 代码块**，参见 [system-flow-template.md](system-flow-template.md)。
- 每条流程图后跟 **关键设计点**（红字 bullets）。
- 用户旅程至少覆盖：新用户转化 / 付费用户生命周期 / 异常路径处理 三条。

### Stage 5 — Polish

- 七、非功能需求（性能 / 兼容性 / 安全 / 国际化）
- 八、埋点（关键事件清单：登录成功 / 生成提交 / 支付完成 / 订阅切换）
- 九、项目规划（按周排里程碑 + 责任人占位）
- 附录（接口文档/原型链接/Figma 链接占位）

Polish checklist：

- [ ] 所有数字（金额/尺寸/时长）单位统一（$ / px / 秒）
- [ ] 模型名首字母大写（Seedream / Seedance / Stripe / OAuth）
- [ ] 所有"待补/待确认"用红字 `<text color="red">` 标注
- [ ] Feishu 粘贴预检：`<grid> / <column> / <lark-table> / <image token>` 标签未被破坏
- [ ] 章节编号沿用「一、二、三…」中文序，不混用阿拉伯数字
- [ ] 所有跨文档引用用 `<mention-doc token="…" type="docx">…</mention-doc>` 占位

## Deliverables to user

返回三件套：

1. `output/PRD_<产品名>_v<版本号>.md` — Feishu 可粘贴的 markdown
2. `output/inventory.json` — Stage 1 扫描结果（便于复盘和增量）
3. 一段简短的「写作摘要」：本次 PRD 共覆盖 N 个模块 / M 个功能点，待用户补充 K 处占位（飞书 token / 截图 token / 价格数字）

## Project structure

```
prd-builder/
├── SKILL.md                    ← you are here
├── doc-architecture.md         9-section locked skeleton
├── feature-point-template.md   每个功能点的固定写法
├── system-flow-template.md     ASCII 流程图 + 节点矩阵规范
├── changelog-convention.md     变更日志 + 红字增量标注规则
├── codebase-mining.md          代码库 → 功能点反向归纳法
├── templates/
│   ├── prd.md                  完整 9 章占位符模板
│   └── feature-point.md        单个功能点片段模板
└── scripts/
    ├── scan_codebase.mjs       代码库结构扫描器
    └── README.md               依赖与用法
```

## Anti-patterns (do not do)

- 不要直接把 README 重排成 PRD —— PRD 视角是"给研发可执行的产品定义"，不是"给用户看的功能介绍"。
- 不要省略 UI 尺寸 —— PRD 不写 px 等于没写，研发会回头追问。
- 不要把所有功能点都堆进一个超大 lark-table —— 每个功能点必须独立 grid 模块，截图独立。
- 不要混用编号系统 —— 章节用中文序「一、二、三…」，功能点用阿拉伯数字「3.4」「3.4b」（小迭代用字母后缀）。
- 不要省略系统架构章节 —— 没有架构图和核心流程的 PRD 永远不是"研发可执行"。
- 不要在功能点正文里写"待定"而不标红 —— 占位必须用 `<text color="red">` 显式标注。
- 不要使用 mermaid —— 飞书 markdown 渲染的兼容性问题让 ASCII 是最稳的选择。
