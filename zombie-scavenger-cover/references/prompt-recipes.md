# 生图提示词配方

## 通用无字底图

```text
Use case: ads-marketing
Asset type: 16:9 social-media cover plate, no typography
Primary request: create an original retrofuturist post-apocalypse comedy-romance scene about [TOPIC].
Input images: Image 1 and Image 2 are style and composition references only; ignore and do not reproduce their player UI, watermarks, brands, logos, play button, progress bar or exact wording.
Scene/backdrop: abandoned atomic-age coastal resort, Googie observation towers, palm trees, weathered roadside signs, oxidized turquoise furniture, salt-corroded architecture under a teal-blue sky and warm cumulus clouds.
Subject: a broad-shouldered cowboy service robot with a rounded glossy black CRT face and simple [blue/green] pixel expression, battered ivory enamel chassis, exposed copper wires, worn dark leather jacket, dusty cowboy hat and faded brick-red paisley bandana; an elegant adult retro mannequin woman with visible ball joints, aged ivory lacquered vinyl skin, blonde bouffant, red headband, yellowed white cat-eye sunglasses, red lipstick, red dress with warm-cream polka dots; one photoreal long-necked ostrich with a goofy curious expression. [ACTION AND RELATIONSHIP]
Style/medium: hyper-detailed stylized CGI with the finish of a hand-painted 1950s pulp advertising poster; atomic-age Googie Americana merged with weathered atompunk salvage culture.
Composition/framing: [LAYOUT RECIPE], large readable silhouettes, title negative space kept clean and low-detail, foreground objects cropped by frame, lower-contrast distant architecture, 50mm lens, eye level or subtly low angle.
Lighting/mood: warm high-noon sunlight, cool cyan ambient fill, crisp contact shadows, sharp small highlights on enamel and glass; sunny, romantic, absurd, adventurous, never frightening.
Color palette: teal, oxidized turquoise, tomato red, warm cream, charcoal and rust-brown; screen glow under two percent.
Materials/textures: chipped enamel, edge-localized rust, salt-air corrosion, sun-cracked leather, faded cotton, foxed paper, restrained halftone, offset ink texture, slight color misregistration and subtle film grain.
Constraints: blank title area; blank or texture-only signs; no embedded words, letters, logos, signatures or watermarks; clear mannequin joints; exactly one robot, one adult mannequin and one ostrich; natural hands and limbs.
Avoid: gore, blood, rotting zombie, horror monster, night scene, neon cyberpunk, steampunk brass overload, military armor, generic space marine, pristine chrome, clean tech-ad render, photoreal human skin, hidden mannequin joints, childlike proportions, sexualized pose, duplicate animals, extra limbs, fused fingers, centered equal-height lineup, fisheye, excessive shallow depth of field, orange-teal blockbuster grade, uniform grunge overlay, random letters, browser frame, video controls, play button, progress bar, app interface, existing brand marks.
```

## standing-poster 动作与构图替换段

```text
The trio stands as a heroic tightly overlapping group. The robot is centered at x 0.56 and nearly full height, slightly forward and seen from a subtly low angle. The mannequin occupies the right third, holds his arm and stands ten percent lower. The ostrich rises between the left title reserve and the robot, its head lower than both leads. Keep the left 40 percent as calm sky for a two-line title. Put a weathered motel sign at lower left and a slender atomic observation tower at far right. Do not align the three heads.
```

## sofa-tableau 动作与构图替换段

```text
The robot and mannequin sit closely on one heavily worn oxidized-turquoise sofa, her head resting affectionately against his shoulder, their silhouettes overlapping. The ostrich rises vertically behind the right half. Keep the upper-left 52 by 36 percent low-detail for a two-line title; balance it with one large blank weathered billboard in the upper right. A newspaper, chipped ceramic mug and old radio form a cropped foreground still life. The city horizon must not cross any face.
```

## 迭代原则

- 底图缺留白：只强化 `calm low-detail sky, no towers, no heads, no signs in the title rectangle`。
- 角色像排队：只强化身体接触、前后遮挡、同一承载物与头部高低差。
- 现代 3D 感过强：只加强旧广告插画、搪瓷掉漆、纸张印刷与年代镜头；不要一次堆叠十种滤镜。
- 人偶变真人：重复 `aged lacquered vinyl skin, visible ball joints, no human pores`。
- 出现文字：重复 `all signs blank, no glyphs, no pseudo-text`。最终标题只由排版脚本生成。
