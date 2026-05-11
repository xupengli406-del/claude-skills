# Claude Code Skills

Claude Code / Cursor 自定义 Skill 库 — 沉淀可复用的认知框架和工作流。

## 使用方法

将 skill 目录复制到 `~/.claude/skills/` 下，即可在任意 Claude Code 会话中通过 `/skill-name` 调用。Cursor Desktop 也可识别同一目录。

```bash
git clone git@github.com:xupengli406-del/claude-skills.git
cp -r claude-skills/* ~/.claude/skills/
```

## Skills 列表

### /biz-judge-tob — ToB 结构性商业判断框架

**用途**：评估一个新项目、新产品或新业务机会的商业可行性。

**方法论**：5 层漏斗验证法（淘汰制，任何一层不通过即判定不可行）

1. **市场结构验证** — 产业链利润分配、平台自建趋势
2. **客户分层验证** — 头部/中腰/长尾/C 端逐层验证付费能力
3. **价值链卡位验证** — 替代成本、数据壁垒、自建可能性
4. **商业模型验证** — CAC/LTV/毛利率、收费模式选择
5. **时机与节奏验证** — 技术成熟度、竞争窗口、团队匹配

**调用**：`/biz-judge-tob 我想做一个xxx产品`

**来源**：2026 年 4 月，从 AI 短剧工具项目被砍的复盘中提炼。

---

### /biz-judge-toc — ToC 商业判断框架

**用途**：专门评估面向个人消费者/创作者的产品的商业可行性。

**方法论**：ToC 专用 5 层漏斗验证法（淘汰制）

1. **需求真伪验证** — 止痛药/维生素/糖果分级、免费替代品压力测试
2. **用户画像与获客验证** — 精确画像、获客渠道可行性、CAC 可控性
3. **应用层厚度验证** — 套壳/轻封装/工作流重构/平台生态四级评估（Cursor 启示）
4. **增长引擎验证** — 病毒式/内容驱动/付费驱动三引擎、留存率基线
5. **单位经济模型验证** — LTV/CAC/回本周期/毛利率/定价权

**调用**：`/biz-judge-toc 我想做一个面向C端用户的xxx产品`

**来源**：2026 年 4 月，从 CloudsVid 产品 ToC 可行性分析及 Cursor 对比中提炼。

**与 /biz-judge-tob 的区别**：biz-judge-tob 偏 ToB（企业客户分层、采购流程、合同逻辑），biz-judge-toc 偏 ToC（用户行为、增长引擎、留存、应用层厚度）。

**配套 Skill**：商业判断通过或待验证后，使用 `/toc-growth` 进入执行验证阶段。

---

### /toc-growth — ToC 产品全流程增长框架

**用途**：ToC 产品从 PMF 验证到规模化增长的四阶段执行方法论。与 `/biz-judge-toc` 配套——商业判断通过或待验证后，用本框架指导执行。

**方法论**：四阶段递进验证（每阶段有明确通过/失败标准）

1. **问题验证**（30-50人）— 用户访谈、痛点命中率、Sean Ellis 测试
2. **留存验证**（500-2000人）— MVP 发布、留存曲线、啊哈时刻到达率
3. **增长验证**（5K-2万人）— 三引擎测试（病毒/内容/付费）、单位经济模型
4. **规模化**（2万+）— 增长引擎放大、留存体系、商业模型优化

**调用**：`/toc-growth 我的产品叫xxx，目前处于xxx阶段`

**来源**：2026 年 4 月，从 CloudsVid ToC 可行性分析中，针对"ToC 验证逻辑与 ToB 的本质区别"提炼。

---

### /tob-growth — ToB 产品全流程增长框架

**用途**：ToB 产品从需求验证到规模化的四阶段执行方法论。与 `/biz-judge-tob` 配套——商业判断通过或待验证后，用本框架指导执行。

**方法论**：四阶段递进验证（每阶段有明确通过/失败标准）

1. **需求验证**（5-10个客户）— ICP 定义、决策人对话、付费试点意愿
2. **交付验证**（1-3个签约）— 种子客户深度交付、产品化率、续约信号
3. **销售模型验证**（10-30个签约）— 销售漏斗标准化、获客渠道验证、LTV/CAC
4. **规模化**（30+签约）— 组织扩张、产品化降本、NDR/NRR 优化

**与 /toc-growth 的区别**：toc-growth 以用户量和留存曲线为核心指标（PMF = 留存收敛），tob-growth 以签约客户和续约率为核心指标（PMF = 客户主动续约 + 愿意做案例背书）。

**调用**：`/tob-growth 我的产品叫xxx，目前处于xxx阶段`

**来源**：2026 年 4 月，从 ToB 与 ToC 增长逻辑的本质差异对比中提炼。

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

---

### /video-editor — 视频剪辑工作流

**用途**：从多段原始素材中剪辑出流畅视频并配字幕。自动安装 FFmpeg + Whisper，转录语音，分析内容，去除气口/口误/重复，按指定时长要求剪辑拼接，生成并烧录字幕。

**方法论**：六步流水线

1. **环境检查** — FFmpeg / Whisper 是否可用，未装则自动安装
2. **素材扫描** — 获取所有视频文件的分辨率、时长、横竖屏信息
3. **语音转录** — Whisper small 模型中文转录，带 word timestamps
4. **内容分析** — 匹配脚本台词、标记气口/口误/重复、确定剪辑方案
5. **剪辑拼接** — FFmpeg 裁剪 + 拼接，支持横竖屏混合（pillarbox）
6. **字幕生成与烧录** — SRT 字幕生成（含 ASR 纠错）+ 硬字幕烧录

**调用**：`/video-editor D:\素材目录 3分钟以内 大家好我们是xxx团队...`

**目录结构**：

```
video-editor/
├── SKILL.md              主入口（6 步工作流 + 触发词）
└── scripts/
    ├── README.md         脚本使用说明
    ├── transcribe.py     Whisper 转录模板
    ├── edit_video.py     FFmpeg 剪辑拼接模板
    ├── generate_srt.py   SRT 字幕生成（含 ASR 纠错）
    └── burn_subtitles.py 字幕烧录模板
```

**来源**：2026 年 5 月，南客松 S2 黑客松 RideSafe 团队 demo 视频剪辑中提炼。

---

### /video-presenter — 讲解视频生成器

**用途**：将结构化内容大纲（产品介绍、框架说明、教程等）自动转化为带动画和中文字幕的深色风格讲解视频。无需打开剪辑软件，一条龙生成。

**技术栈**：Hyperframes（HTML 合成 + 逐帧渲染）+ edge-tts（中文 TTS）+ GSAP（入场动画）+ FFmpeg（字幕烧录）

**方法论**：十步流水线

1. **准备脚本** — 将内容组织为场景列表（标题/副标题/要点/旁白）
2. **TTS 语音合成** — edge-tts `zh-CN-YunxiNeural` 逐场景生成 MP3
3. **获取音频时长** — ffprobe 获取精确时长
4. **计算时间线** — 场景起止时间、音频偏移、动画入点
5. **编写 HTML 合成文件** — Hyperframes 合成文件 + CSS 深色高端风格 + GSAP 动画
6. **Lint 检查** — `hyperframes lint` 确保 0 errors
7. **渲染视频** — `hyperframes render` 无头 Chrome 逐帧截图 + FFmpeg 编码
8. **生成 SRT 字幕** — 根据旁白文案和时间线生成 SRT
9. **烧录字幕** — FFmpeg subtitles filter 白字黑描边
10. **清理** — 删除中间文件，保留成品视频 + HTML 源文件

**输出**：1920×1080 H.264+AAC 视频，带烧录中文字幕

**调用**：`/video-presenter ToB增长框架 6个场景 [每场景标题+要点+旁白文案]`

**前置要求**：Node.js >= 22, FFmpeg, Python 3 + edge-tts, Hyperframes CLI (`npm i -g hyperframes`)

**来源**：2026 年 5 月，从 tob-growth 和 video-editor 两个 skill 的讲解视频制作实践中提炼。
