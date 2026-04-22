# 代码库 → PRD 的反向挖掘方法

本文件回答 Stage 1（Mine）的核心问题：**给一个 demo 代码库，怎么系统性地导出"模块 × 功能点"清单？**

---

## 一、必读文件清单（按优先级）

| 优先级 | 文件 / 目录 | 抽什么信息 |
| --- | --- | --- |
| ★★★ | `package.json` | 框架（React/Vue/Next）、UI 库（Tailwind/AntD）、状态管理库（zustand/redux） |
| ★★★ | `vite.config.*` / `next.config.*` | 路由方式、构建目标、环境变量 |
| ★★★ | `src/router*` / `src/pages/` / `src/routes/` / `src/App.tsx` | 顶层路由 = PRD 模块的强候选 |
| ★★★ | `src/components/**/*Modal*.tsx` | 每个 Modal 通常 = 一个功能点 |
| ★★★ | `src/components/**/*Dialog*.tsx` | 同上 |
| ★★★ | `src/store/*.ts` (zustand) / `src/slices/*` (redux) | 业务实体清单 = 功能点的"对象"线索 |
| ★★ | `src/constants/pricing.*` / `src/config/*` | 计费 / 套餐 / 配额数字 = 计费功能点的硬数据 |
| ★★ | `src/api/` / `src/services/` | 外部依赖（中台、Stripe、MaaS）= 系统架构图节点 |
| ★★ | `README.md` / `AGENTS.md` / `CLAUDE.md` | 产品自述 = 需求背景章节素材 |
| ★ | `src/i18n/` | 文案串 = UI 元素清单的辅证 |
| ★ | `tests/` | 测试覆盖 = 哪些功能点已稳定 vs Mock |

---

## 二、模块识别启发式

### 启发 1：路由即模块

顶层路由（`/login` `/workspace` `/files` `/billing`）通常就是 PRD 一级模块。把每条路由翻译成中文模块名：

| 路由 | 模块名 |
| --- | --- |
| `/login` | 账户系统 |
| `/workspace` | 工作区框架 |
| `/workspace/image` | AI 图片生成 |
| `/workspace/video` | AI 视频生成 |
| `/files` | 文件管理系统 |
| `/billing` 或 `/account/billing` | 计费系统 |

### 启发 2：Store slice 即业务实体

每个 zustand store 或 redux slice 通常对应一个业务实体，是功能点的"对象"：

```
accountStore   → 账户系统的功能点对象
projectStore   → 文件管理系统的功能点对象
generationStore → AI 生成系统的功能点对象
```

### 启发 3：Modal/Dialog 即功能点

`*Modal.tsx` `*Dialog.tsx` `*Drawer.tsx` `*Popover.tsx` 这些组件文件名几乎一一对应一个功能点。

```
LoginModal.tsx       → 功能点 1.1：登录弹窗
AccountModals.tsx    → 功能点 1.2/1.3/1.4：用户菜单 / 注销 / 个人信息
TokenRechargeModal.tsx → 功能点 6.7：Token 充值弹窗
BalanceDetailModal.tsx → 功能点 6.6：余额详情弹窗
```

### 启发 4：常量文件即"硬数据"

`pricing.ts` `quota.ts` `models.ts` 这种全大写常量文件，是 PRD 写"价格表 / 模型表 / 配额表"时的唯一可信来源 —— **不要靠记忆，每次重新读这些文件**。

### 启发 5：依赖外部域名 = 系统架构节点

grep 整个 `src/` 找 `https://...` `process.env.X_API_URL`，提炼出所有外部依赖（Stripe / MaaS / 中台 / OAuth provider），这些是「六（附）系统节点说明」表的输入。

---

## 三、Stage 1 推荐扫描顺序（agent 操作步骤）

```
1. 读 package.json 摸清技术栈
2. 读 README/AGENTS/CLAUDE.md 摸清产品定位
3. ls src/ 看顶层目录结构
4. grep -r "createBrowserRouter\|<Route\|RouterProvider" src/  → 拿到顶层路由
5. ls src/store/ 或 src/slices/ → 拿到业务实体
6. find src/components -name "*Modal*" -o -name "*Dialog*" → 拿到功能点候选
7. cat src/constants/pricing.* → 拿到计费硬数据
8. grep -r "https://\|fetch(\|axios" src/ | grep -v test → 拿到外部依赖
9. （可选）node scripts/scan_codebase.mjs <repo>  → 自动汇总成 inventory.json
```

---

## 四、从 inventory 到模块树的归纳模板

把 Stage 1 输出整理成一段 markdown 给用户确认：

````markdown
## 反向挖掘结果（待确认）

### 技术栈
- 前端：React 18 + Vite + TypeScript + Tailwind + Zustand
- 后端依赖：Stripe / OAuth (Google/Apple/Discord) / 中台 / CloudsWay MaaS

### 模块清单（按用户路径）
1. **账户系统** ← /login 路由 + accountStore
   - 候选功能点：LoginModal / AccountModals / BalanceDetailModal …
2. **工作区框架** ← /workspace 路由 + WorkspaceShell.tsx
   - 候选功能点：左侧导航 / 顶部 tabs / 分屏 / 欢迎页
3. **AI 图片生成** ← GenerationPane.tsx + projectStore
   - 候选功能点：Prompt 输入 / 模型选择 / 比例 / 参考图 / 版本管理 / 结果展示
…

### 计费硬数据（来自 src/constants/pricing.ts）
- 套餐：Free / Pro $19 / Team $99
- Token 单价：…

### 外部依赖
- Stripe → 支付
- OAuth (Google/Apple/Discord) → 登录
- 中台 API → 用户/Token/账单
- MaaS → AI 推理

请确认模块清单是否准确，需要拆分/合并/补充的请告诉我，确认后我开始写每个功能点。
````

---

## 五、典型陷阱

| 陷阱 | 反例 | 正解 |
| --- | --- | --- |
| 把工具组件当功能点 | `Button.tsx` 当成功能点 | 通用组件不进 PRD，只有"业务弹窗"才是功能点 |
| 漏掉无 Modal 的页面级功能 | 只扫 `*Modal*` 漏掉 `WelcomePage.tsx` | 同时扫 `*Page*` `*Pane*` `*View*` |
| 把废弃代码当现状 | 把 `legacy/` `__deprecated/` 写进 PRD | 扫描时显式过滤 `legacy|deprecated|backup|__archive` |
| 忽略 Mock vs 真实 | 把 `setTimeout(1500, 'paid')` 写成"调 Stripe 完成支付" | 在功能点规则区**明确标注 Mock 实现** |
| 把后端逻辑当前端能力 | 把 `backend/` 的 API 直接当功能点 | 后端逻辑放进「六（附）系统架构」章节，不进六（功能详细） |

---

## 六、产出物

Stage 1 完成时应有：

1. `output/inventory.json` — 机器可读的模块×功能点清单（来自 `scripts/scan_codebase.mjs`）
2. 一段给用户的中文确认 markdown（如三的范式）
3. 一份「外部依赖矩阵」用于后续填充节点说明表

只有这三件齐了，Stage 2 才能开始填章节骨架。
