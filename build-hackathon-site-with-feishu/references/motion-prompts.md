# 首屏动效方案与提示词

## 方案 A：双图聚光揭示（默认经典基线）

所有新网站默认先复刻这一方案。完整页面结构、实现 Prompt、成对素材 Prompt 和验收清单见 [classic-spotlight-hero.md](classic-spotlight-hero.md)。本文件以下内容用于快速理解和选择后续变体。

### 设计目标

深黑背景中放置同构的两张地形/抽象网络图：基础图低饱和、低亮度；揭示图含品牌色能量脉络。鼠标附近以柔和圆形 mask 显示揭示图，位置带 0.1 的缓动追踪。触摸设备自动缓慢巡游，减少动态偏好下显示静态合成图。

### 生成素材提示词

```text
Create two perfectly aligned, seamless 16:9 cinematic abstract terrain images for a premium AI Agent hackathon landing page. The geometry and camera must be identical in both outputs: a sweeping black mineral-like mountain mesh flowing from lower left to upper right, large negative black space on the left for typography, no people, no buildings, no logo, no text.

BASE VERSION: near-black graphite fibers, subtle charcoal ridges, sparse moss-like dark green microdetails, extremely restrained light, matte and sophisticated.

REVEAL VERSION: preserve the exact same geometry, camera and crop; illuminate selected ridgelines and inner strata with warm ember orange plus a small amount of electric green, as if an intelligent network is waking inside the terrain. Photoreal procedural 3D fibers, crisp local detail, deep black background, premium technology editorial art, no bloom haze, no watermark.
```

必须生成同尺寸、同构图的 base/reveal 两张图。不同构图会导致揭示区域“跳变”。

### 实现提示词

```text
Build a full-screen dark hero in React and TypeScript. Layer a base background and a perfectly aligned reveal background. Reveal the top image only through a cursor-following radial-gradient CSS mask. Smooth pointer movement with requestAnimationFrame using 0.1 lerp. Use a radius around 240–300px with a soft falloff. On coarse pointers, animate a slow autonomous path. Add a static fallback for reduced motion and low performance. Keep the content layer independent from the media layer, preserve keyboard access, and clean up every listener and RAF on unmount.
```

### CSS mask 推荐

优先直接设置：

```css
mask-image: radial-gradient(circle var(--spot-r) at var(--spot-x) var(--spot-y), #000 0 38%, rgb(0 0 0 / .75) 58%, transparent 100%);
```

这比每帧 `canvas.toDataURL()` 更省内存。只有需要非径向复杂纹理时才使用 Canvas。

## 方案 B：背景视频

```text
Create an 8-second seamless 16:9 loop for an AI Agent hackathon hero. A black procedural terrain made of fine graphite fibers slowly breathes and folds. Thin emerald and ember signals travel through the ridges like autonomous workflows. Camera movement is extremely slow and stable, large negative space on the left, no text, no logo, no humans, no cuts, no strobe, no sudden brightness. First and last frames must match for a perfect loop.
```

实现要求：MP4/WebM、静音、`playsInline`、poster、移动端和减少动态降级；文字对比度始终达标。

## 方案 C：Canvas 粒子 Agent 网络

- 粒子表示任务，连线表示工具调用，完成后从灰色变品牌绿。
- 鼠标只产生局部吸引，不追逐指针。
- 粒子数量按设备性能自适应，后台标签页暂停。
- 画布仅作装饰，`aria-hidden=true`。

## 方案 D：WebGL/Shader 流场

- 使用噪声流场表现“生成 → 计划 → 执行 → 交付”。
- 最大帧率可限制为 30；WebGL 初始化失败显示静态图。
- 不把着色器作为关键内容，不因动画阻塞首屏。

## 方案 E：滚动图像序列

- 首屏滚动把抽象提示词逐渐变成完整工作流网络。
- 预载首帧和关键帧，剩余帧空闲加载。
- 移动端只保留 20–30 帧或改为视频。

## 方案 F：实时数据动效

- 只显示聚合且可公开的数据，如报名数、城市数、提交倒计时。
- 数据失败时保持上次值并标注更新时间；不能暴露个人信息。
- 不用随机滚动数字伪装实时数据。

## 通用验收

- 文字区留有足够负空间；背景不抢标题。
- 60fps 为目标，低端设备至少稳定 30fps。
- 关键动效不造成布局偏移。
- 支持 `prefers-reduced-motion`、触摸和键盘。
- 没有版权不明的第三方素材、人物或 Logo。
