# Claude Code Skills

Claude Code / Cursor 自定义 Skill 库 — 沉淀可复用的认知框架和工作流。

## 使用方法

将 skill 目录复制到 `~/.claude/skills/` 下，即可在任意 Claude Code 会话中通过 `/skill-name` 调用。Cursor Desktop 也可识别同一目录。

```bash
git clone git@github.com:xupengli406-del/claude-skills.git
cp -r claude-skills/* ~/.claude/skills/
```

## Skills 列表

### /biz-judge — 结构性商业判断框架

**用途**：评估一个新项目、新产品或新业务机会的商业可行性。

**方法论**：5 层漏斗验证法（淘汰制，任何一层不通过即判定不可行）

1. **市场结构验证** — 产业链利润分配、平台自建趋势
2. **客户分层验证** — 头部/中腰/长尾/C 端逐层验证付费能力
3. **价值链卡位验证** — 替代成本、数据壁垒、自建可能性
4. **商业模型验证** — CAC/LTV/毛利率、收费模式选择
5. **时机与节奏验证** — 技术成熟度、竞争窗口、团队匹配

**调用**：`/biz-judge 我想做一个xxx产品`

**来源**：2026 年 4 月，从 AI 短剧工具项目被砍的复盘中提炼。

---

### /resume-builder — 个人简历产品化产线

**用途**：把"写/改/定制简历"沉淀成一条可复用产线，每次输出都是品牌一致的**单页 A4 PDF**。

**核心资产**：

- 黑白极简版式（已锁死 CSS，单页 A4，4×4px 方块 bullet）
- 资深 HR 写作铁律（能力标签起手 / 抽象任务为能力 / 黑名单词汇 / 等字策略）
- 多版本策略矩阵（**岗位 × 公司**：AIGC / Agent / 高级 PM × 大厂 / 创业 / 独角兽）
- HTML → PDF 渲染管线（Playwright + Chromium，单页校验 + 残留占位符拒绝渲染）

**五阶段工作流**：

1. **Intake** — 收集素材（PDF / 飞书 / 代码库），锁定底稿
2. **Position** — 按岗位×公司选定版本变体
3. **Write** — 按 `style-guide.md` 改写每条 bullet
4. **Layout** — 填 `templates/resume.html` 占位符
5. **Render** — `node scripts/render_pdf.mjs` 输出 PDF + 预览图

**调用**：

- 增量改简历：`帮我把 xxx 经历加到简历里`
- 定制投递版：`这版简历投字节，岗位是 AIGC 产品经理`
- 从零开始：`我要从零写一份简历，目标是 Agent 产品经理`

**目录结构**：

```
resume-builder/
├── SKILL.md              主入口（描述 + 触发词 + 五阶段）
├── style-guide.md        资深 HR 写作铁律
├── layout-spec.md        A4 单页版式规格手册
├── version-strategy.md   岗位×公司差异化策略
├── templates/
│   └── resume.html       占位符模板（不要碰 <style>）
└── scripts/
    ├── render_pdf.mjs    Playwright HTML→PDF
    ├── extract_pdf.py    PyMuPDF 源 PDF 提取
    └── README.md         依赖与用法
```

**来源**：2026 年 4 月，从一次完整的简历更新闭环（飞书素材抓取 → HR 视角改写 → A4 单页 HTML 复刻 → 多轮调优 → PDF 输出）中提炼。

---

### /prd-builder — Demo 代码库 → 研发可执行 PRD

**用途**：把任意 demo / 原型 / 黑客松项目代码库，反向生成符合"研发可执行"标准的飞书 PRD。

**核心资产**：

- 9 章固定骨架（版本 / 变更日志 / 文档说明 / 需求背景 / 需求范围 / 功能详细 / 系统架构 / 用户旅程 / 非功能 / 埋点 / 项目规划）
- 功能点 grid 模板（左 40% 文字、右 60% 截图、下方规则区，所有功能点统一格式）
- 系统流程 ASCII 图规范（不用 mermaid，飞书/GitHub 三端兼容）
- 变更日志 + 红字增量标注规则（每个小版本独立 lark-table，红字标注新增/修改）
- 代码库反向挖掘启发式（路由 → 模块 / Modal → 功能点 / store → 业务实体 / 常量 → 计费数据）

**五阶段工作流**：

1. **Mine** — `node scripts/scan_codebase.mjs <repo>` 扫出模块×功能点清单
2. **Outline** — 填 9 章骨架，模块总览签字确认
3. **Detail** — 每个功能点按 grid 模板逐个写
4. **System** — 画 ASCII 系统架构 + 4 条核心流程 + 3 条用户旅程
5. **Polish** — 变更日志 / 红字标注 / 飞书粘贴预检

**调用**：

- 全新 PRD：`帮我把 D:/work/my-demo 这个项目沉淀成 PRD`
- 增量更新：`在 v1.3 PRD 基础上加一个新模块的功能点，做 v1.4`
- 单点补全：`这个 Modal 还没写进 PRD，按现有风格补上`

**目录结构**：

```
prd-builder/
├── SKILL.md                    主入口（5 阶段工作流 + 触发词 + 反模式）
├── doc-architecture.md         9 大章节固定骨架
├── feature-point-template.md   功能点写作规范
├── system-flow-template.md     ASCII 流程图 + 节点矩阵规范
├── changelog-convention.md     变更日志 + 红字增量标注规则
├── codebase-mining.md          代码库反向挖掘方法
├── templates/
│   ├── prd.md                  完整 9 章占位符模板
│   └── feature-point.md        单个功能点片段
└── scripts/
    ├── scan_codebase.mjs       零依赖代码库扫描器
    └── README.md
```

**来源**：2026 年 4 月，从「短剧产品 v1_PRD_研发可执行文档」（已被研发认可）中提炼骨架与规则。

---

## 仓库可见性

私有仓库。如果未来沉淀更通用、不含个人数据的 skill，可单独抽出公开。
