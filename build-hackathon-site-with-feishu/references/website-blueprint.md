# 黑客松官网蓝图

## 信息架构

### 首屏

- 品牌与联合主办方
- 赛事名称、核心命题、时间/城市/状态
- 主 CTA：报名/提交创意
- 次 CTA：赛事回顾或赛事细则
- 关键指标：时长、队伍、人数、奖池
- 动态背景 + 对比度遮罩，文字不依赖背景图可读

### 赛事价值

- 这场赛事解决什么问题
- 面向谁、交付什么、和普通 Demo Day 的区别
- 一句话规则：真实问题、可运行产品、限时交付

### 嘉宾/领航者

- 无限循环轮播，中心卡强调，其余卡弱化
- 姓名、规范头衔、机构、照片替代文本
- 卡片顺序按组委会确认，不暗示排名

### 日程

- 按日/阶段切换
- 每条含时间、环节、说明、参与对象
- 对外日程与内部 Run of Show 分离

### 赛道

- 每张卡含真实问题域、目标交付、允许工具、示例边界
- 使用非人像品牌插画、生成图或抽象动效

### 评委与评分

- 评委公开资料和“排名不分先后”
- 权重、评分锚点、路演时长、去极值/合议说明

### 奖项

- 奖项名称、名额、金额/权益、适用条件
- 金额和税务说明来自冻结规则
- 使用奖杯/吉祥物插画，不用无关现场照片

### 回顾与更多信息

- 现场照片仅放在回顾区
- `赛事细则`、`选手手册`、`获奖公示`等直接链接飞书公开文档
- 每个外链明确目标，使用 `target=_blank` 与 `rel=noreferrer`

## 交互规范

- 固定导航随滚动切换当前区段；移动端提供菜单。
- 报名弹窗打开后锁定页面滚动、聚焦首字段、Escape 关闭、焦点不可逃逸。
- 轮播按钮有 aria-label；触摸滑动和键盘可用；自动播放在用户交互后暂停一段时间。
- IntersectionObserver 入场动画只执行一次；减少动态偏好下直接显示。
- 所有 CTA 有 loading、success、error、retry 状态。

## 无限轮播算法

1. 原数据长度为 `N`，渲染 `[items, items, items]`。
2. 初始索引设为 `N + desiredIndex`。
3. 每次只改变索引并执行 CSS transform 过渡。
4. `transitionend` 时若索引 `>=2N`，临时关闭过渡并减 `N`；若 `<N` 则加 `N`。
5. 下一帧恢复过渡。容器保持 overflow hidden，track 宽度按卡片步长计算。

## 首屏媒体接口

建议统一为：

```ts
type HeroMedia =
  | { mode: "spotlight"; base: string; reveal: string; radius: number }
  | { mode: "video"; src: string; poster: string }
  | { mode: "canvas"; preset: string }
  | { mode: "shader"; fragment: string; fallback: string }
  | { mode: "image-sequence"; frames: string[]; poster: string }
  | { mode: "static"; src: string };
```

媒体层不承载关键文字；必须有静态 fallback。视频应压缩、静音、循环、`playsInline`，移动网络可禁用自动播放。

## 性能预算

- 首屏静态海报尽量 < 350 KB；视频移动端建议 < 4 MB。
- 首屏 LCP 资源预加载，非首屏图片 lazy-load。
- 动画只改 transform/opacity/mask-position，避免每帧生成大 data URL。
- 聚光方案优先使用 CSS radial-gradient mask；Canvas 方案只在需要复杂渐变时使用。
- 指针坐标用 requestAnimationFrame 平滑；组件卸载时移除监听和 RAF。

## 内容配置

不要把活动事实散落在 JSX。全部从配置读取：

- `event`, `brand`, `hero`, `tracks`, `agenda`, `advocates`, `judges`, `scoring`, `awards`, `gallery`, `links`, `registration`。
- 图片记录来源、授权状态和替代文本。
- 飞书链接记录公开权限检查时间。
