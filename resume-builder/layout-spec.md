# 版式规格手册

`resume-builder` 的视觉锁定标准。任何编辑必须**沿用 templates/resume.html 内的 CSS 块**，下面的规格是给 agent 校对、给未来重构时还原版式用的，不是手动重新实现版式的指南。

---

## 一、纸张与边距

| 项 | 值 |
| --- | --- |
| 纸张 | A4 (210mm × 297mm) |
| `@page` margin | 0（边距由 `.page` 内 padding 控制） |
| `.page` padding | 顶 10.5mm / 右 12.5mm / 底 9mm / 左 12.5mm |
| 内容宽度 | 185mm（210 − 12.5 × 2） |
| 内容高度 | 277.5mm（297 − 10.5 − 9） |
| 渲染目标 | 严格单页 |

---

## 二、字体与字号

| 元素 | 字号 | 字重 | 行高 |
| --- | --- | --- | --- |
| 正文（body） | 9.15pt | 400 | 1.42 |
| 姓名（.name） | 25pt | 700 | 1 |
| 联系方式（.contact） | 9.2pt | 400 | — |
| 意向岗位标签（.label） | 8.7pt | 400 | letter-spacing 5px |
| 意向岗位（.target） | 13.2pt | 700 | — |
| Section 标题（.section-title） | 10.7pt | 700 | letter-spacing 1px |
| 项目/工作标题（.item-title） | 10.2pt | 700 | — |
| 项目时间/角色（.item-meta） | 8.9pt | 500 | nowrap |
| 教育/技能行 | 8.95–9.4pt | 700 表头 | — |
| Bullet 正文 | 9.05pt | 400 | 1.43 |

字体栈：`"PingFang SC", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "Hiragino Sans GB", "Segoe UI", "Helvetica Neue", Arial, sans-serif`

---

## 三、配色

| 用途 | 色值 |
| --- | --- |
| 主文字 | `#1c1c1e` |
| 次要文字（item-meta、label） | `#4a4a4f` / `#6b6b6f` |
| 分隔线（.contact 的竖线） | `#c8c8c8` |
| Section 标题底色 | `#1c1c1e`（白字） |
| 页面背景 | `#fff` |

**禁用任何彩色**，黑/白/灰三色是品牌识别。

---

## 四、Section 结构

```
┌─ section ─────────────────────────────┐
│ ▌section-title（黑底白字 inline-block）│
│                                       │
│  内容区（edu-row / item / kv-row）    │
└───────────────────────────────────────┘
```

Section 之间间距：`margin-top: 8px`（首个 section 为 0）。Section 标题与内容间距：`margin-bottom: 4px`。

固定 Section 顺序：

1. 核心优势（3 条 bullets，每条 1–3 行）
2. 教育背景（1 行 edu-row）
3. 核心项目经历（2–4 个 item，按时间倒序）
4. 工作经历（2–3 个 item，按时间倒序）
5. 技能与荣誉（2 行 kv-row：荣誉证书 + 核心技能）

---

## 五、关键栅格

### Header

```
flex space-between, align-items: flex-end
border-bottom: 1px solid #1c1c1e
padding-bottom: 7px
margin-bottom: 9px
```

左侧：姓名（粗黑大字） + 联系方式（手机 | 邮箱）  
右侧：意向岗位标签（小灰字带 letter-spacing） + 意向岗位（中黑字）

### 教育背景 edu-row

```
display: grid
grid-template-columns: 1.35fr 1.35fr 0.7fr 1fr
column-gap: 14px
```

四列：学校（粗体） / 专业 / 学历 / 时间（右对齐灰色）

### 项目/工作 item-head

```
display: flex
justify-content: space-between
align-items: baseline
```

左：item-title（粗黑 10.2pt）
右：item-meta = `<span class="role">角色</span>时间`（角色加粗，role 与时间间距 14px）

### Bullets

```
list-style: none
正文 padding-left: 11px（给方块留位）
li::before { width: 3.5px; height: 3.5px; background: #1c1c1e; top: 0.55em; }
```

**3.5×3.5 px 实心方块**，不是圆点。bullet 间距 `margin: 1px 0`。

### 技能与荣誉 kv-row

```
display: grid
grid-template-columns: 76px 1fr
column-gap: 10px
```

两列：标签（76px 固定，粗体且 `white-space: nowrap`） / 内容。`Vibe Coding` 等标签必须保持单行。

---

## 六、渲染参数（render_pdf.mjs 锁死）

```js
viewport: { width: 1240, height: 1754 }
deviceScaleFactor: 2
emulateMedia: 'print'
pdf: {
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
}
```

`preferCSSPageSize: true` 让 `@page { size: A4; margin: 0 }` 生效，避免 Playwright 自动加 margin。

---

## 七、可调参数（仅在确实溢出时改）

按修改风险**从低到高**：

1. 缩短最长 bullet 一句话（最安全）。
2. 删掉某个项目的尾条 bullet（中等风险）。
3. 合并两段相邻短工作经历（影响经历完整性）。
4. ⚠️ **绝不要** 改字号、行高、margin、padding —— 一改全盘版式都要重新校对。

---

## 八、视觉 QA checklist

```
- [ ] 仍为单页 A4
- [ ] Header 左右两端对齐
- [ ] 每个 section 的标题都是黑底白字
- [ ] bullet 是方块不是圆点
- [ ] 所有 item 的"角色 + 时间"都对齐右侧
- [ ] 技能与荣誉左侧标签均保持单行
- [ ] 没有彩色出现
- [ ] 没有任何 {{占位符}} 漏渲染
```
