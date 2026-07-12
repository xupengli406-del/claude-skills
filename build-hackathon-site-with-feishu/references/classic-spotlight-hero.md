# 经典基线：双图聚光地形首屏

这是本 Skill 的默认第一版。任何新活动网站都先在本地复刻这一版的页面结构和首屏动效，确认构建与交互正常，再替换活动信息或选择其他媒体方案。它不包含任何历史活动名称、人员、地点、奖项或飞书链接。

## 基线资产

- 基础地形：`assets/site-template/public/hackathon-assets/hero-terrain-base.webp`
- 聚光揭示：`assets/site-template/public/hackathon-assets/hero-terrain-reveal.webp`
- React 实现：`assets/site-template/app/page.tsx` 中的 `HeroSpotlight`
- 样式实现：`assets/site-template/app/globals.css` 中的 `.hero-terrain-*` 与 `.hero-*`

两张图已经同尺寸、同视角、同构图。不得只替换其中一张；新素材也必须成对生成。

## 经典首屏结构

从后向前保持以下层级：

1. 深黑底色。
2. Base 地形图。
3. Reveal 地形图，通过鼠标聚光 mask 局部显示。
4. 横向暗角、径向暗角和底部渐暗。
5. 轻微扫描线。
6. 左上/右上活动元信息。
7. 左侧主标题：小号眉题、无衬线主标题、斜体衬线强调词。
8. 一句话主张和状态胶囊。
9. 主/次 CTA。
10. 左右控制台式辅助信息。
11. 底部四格数据条。
12. 顶部固定导航和报名按钮。

首屏媒体与内容分层；活动文字、链接和数字可以替换，但空间关系、层级和聚光机制先保持不变。

## 可直接复用的完整实现 Prompt

```text
Build the canonical first-pass hero for a reusable hackathon event website using React, TypeScript and CSS. Do not insert any real event name, city, people, prizes or document URLs; use explicit placeholders for all event content. The purpose of this first pass is to reproduce the structure and motion system before customization.

Create a full-viewport dark hero with a fixed top navigation. Use the bundled, perfectly aligned image pair:
- /hackathon-assets/hero-terrain-base.webp
- /hackathon-assets/hero-terrain-reveal.webp

Layer both images edge-to-edge with identical background-position:center and background-size:cover. The base image is always visible. Reveal the second image only through a soft cursor-following circular CSS mask. Store pointer coordinates in a raw object, keep a second smoothed position, and animate with requestAnimationFrame using:
smooth.x += (raw.x - smooth.x) * 0.1
smooth.y += (raw.y - smooth.y) * 0.1
Write the eased values to CSS custom properties --spot-x and --spot-y.

Desktop mask:
radial-gradient(circle 260px at var(--spot-x) var(--spot-y), #fff 0 40%, rgba(255,255,255,.75) 60%, rgba(255,255,255,.4) 75%, rgba(255,255,255,.12) 88%, transparent 100%)

Mobile mask radius: about 170px. On coarse-pointer devices, do not depend on touch movement; move the spotlight autonomously on a slow sinusoidal path. Remove every event listener and cancel the RAF on unmount.

Animate the terrain stage on load from opacity 0, scale 1.12 and blur 10px to opacity 1, scale about 1.035 and zero blur using a premium cubic-bezier easing. After entering, apply a very slow 14-second alternate drift/zoom. Add prefers-reduced-motion support: disable terrain motion and replace the moving spotlight with a static horizontal reveal mask.

Above the terrain, add three visual treatments: a left-to-right black readability gradient, a soft radial vignette, and a bottom fade into the page background. Add subtle scanlines at low opacity. The media layer must be aria-hidden and must never contain essential information.

Place the content on the left with generous negative space. Compose the title from:
- a small uppercase monospace event label;
- a very large bold sans-serif first line;
- a large italic serif second line, offset to the right.
Under it place a short value proposition, a bordered status pill with a glowing green dot, and two CTAs. Add small console-like metadata at the bottom-left and bottom-right and a translucent four-column stats bar centered at the bottom.

Use a black/graphite palette, off-white typography, emerald #24E692 as the primary accent, and restrained violet only for small decorative elements. Keep the design editorial, cinematic and technical. No rounded card-heavy SaaS look, no stock-photo hero, no people in the hero, no logo watermark, and no invented event facts.

On mobile, retain the same hierarchy: fixed navigation, left-aligned title, compact CTAs, autonomous spotlight, and four-column stats. Prevent horizontal overflow and keep the hero legible over the background.

After implementing this canonical pass, run the production build. Do not customize sections, copy, colors, or media mode until the baseline builds successfully.
```

## 成对素材生成 Prompt

```text
Create two perfectly aligned, seamless 16:9 cinematic abstract terrain images for a premium hackathon landing page. The geometry, camera, crop, ridge positions and negative space must be identical in both outputs. Compose a sweeping black mineral-like mountain mesh flowing across the frame, with generous near-black negative space on the left for typography. No people, no buildings, no logo, no text, no watermark.

BASE VERSION: near-black graphite fibers, subtle charcoal ridges, sparse dark-green microdetails, extremely restrained light, matte and sophisticated.

REVEAL VERSION: preserve the exact same geometry, camera and crop; illuminate selected ridgelines and inner strata with warm ember orange plus controlled emerald signals, as if an intelligent network is waking inside the terrain. Crisp procedural 3D fiber detail, deep black background, premium technology editorial art, no excessive bloom or haze.
```

如果生成工具不能一次产出严格同构双图，先生成 Base，再以 Base 作为参考图进行编辑得到 Reveal；不要分别独立生成两张构图不同的图。

## 第一版验收

- Base 与 Reveal 无位置跳变。
- 鼠标快速移动时聚光有平滑滞后，不抖动。
- 触屏设备无需触摸也能看到缓慢揭示。
- 减少动态模式无持续动画。
- 标题、CTA、状态和数据条均不被背景吞没。
- 1440px、1024px、390px 宽度没有横向溢出。
- 生产构建通过。
- 第一版仍是占位内容，没有任何历史活动数据。

## 基线完成后允许变化

- 替换品牌、标题、活动信息、CTA 和数据。
- 替换为新生成的同构双图。
- 改为背景视频、Canvas、Shader 或图像序列。
- 调整配色和字体，但保留可读性、降级和无障碍。
- 根据新活动隐藏或增加后续区块。

任何变化都从已经通过构建的经典基线分支开始，避免一边重做结构、一边排查基础动效问题。
