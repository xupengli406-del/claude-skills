# 数字人口播视频 Skill

**让AI按同一套制作方法完成配音、数字人出镜、字幕和解释动画。**

不是只让一张脸念稿：写作规则、音画时间轴、人物小窗、同屏逐步讲解、图层拆解、柔和转场和成片检查都在包里。2026-09-24版本将一条已获创作者认可的4分31秒成片规范整理为默认制作方法，并附可运行的Remotion模板。

## 完整流程

观点与资料 → 自然口播稿 → MOSS授权音色或本人录音 → HeyGen音频驱动出镜 → 实际声音对齐字幕 → Remotion连续讲解动画 → FFmpeg核对导出 → 封面与发布包。

AI负责执行，创作者负责观点、素材授权和最后判断。一次接入不等于任意题目都能一次出到满意；声音、形象和解释结构仍需实际检查。

源代码：[GitHub完整Skill目录](https://github.com/xupengli406-del/claude-skills/tree/main/produce-digital-avatar-social-video)。

## 安装与使用

解压后，把整个`produce-digital-avatar-social-video`文件夹安装到支持Skill的助手中。Codex通常放在`~/.codex/skills/`；其他工具按各自的技能安装方法操作。必须保留references、scripts、templates和图标许可，不能只复制SKILL.md。

把下面这段话连同素材发给助手：

> 用 $produce-digital-avatar-social-video 做一条数字人口播。沿用包内连续讲解风格：暖灰、炭黑和陶土色，同屏保留上下文，随声音逐步揭示信息，人物大镜头和同步小窗交替，完整动画解释原因与效果。使用我的授权照片和声音、已配置的API。先核对稿件和代表性短段，认可后做完整视频和发布包，不自动发布。主题是：……

已有认可的稿件、声音和样片时直接说“这些已经认可，复用并继续”，不用重复生成。

## 需要准备什么

- 自己的观点/稿件，以及有权使用的人物照片和音色；也可以用本人已录旁白。
- 自己的MOSS、HeyGen API和对应可用额度；照片驱动与训练分身的权限可能不同。密钥配置在环境变量或系统密钥管理器中，不写在稿件或分享包。
- 可读写文件、调用API和执行后期的AI助手。只有聊天连接器、无法取得素材或运行后期的环境不能完成本包全部流程。
- Remotion模板需要Node.js 20+、npm、Chrome、中文字体；成片检查需要FFmpeg/ffprobe，字幕对齐需要可用Whisper或其他对齐器。脚本不是打包好的独立应用。

[MOSS / HeyGen接入](references/providers.md)包含现有API脚本的配置与调用说明。服务额度、音色和引擎能力使用当天核对；不附送额度，不承诺免费。

## 包里具体增加了什么

| 内容 | 用途 |
| --- | --- |
| [SKILL.md](SKILL.md) | 写稿、生成、后期、样片与验收的执行入口 |
| [连续讲解规范](references/continuous-motion.md) | 信息随声画推进、同屏上下文、转场、四层拆解、字体配色和读图停留 |
| [口播与后期](references/editorial-and-postproduction.md) | 自然表达、事实、真实资料、字幕和出版边界 |
| [大标题真人封面](references/covers.md) | 本人近景、人物轮廓描边、大字压人像；3:4与4:3分别构图，附排版检查脚本 |
| [导演表](templates/director-table.md) | 将每一段落实到声音锚点、动作、完成态与停留 |
| [Remotion模板](templates/remotion/README.md) | 30秒通用无声示例、持续面板、渐进揭示、四层组件、字幕和嘴型时间映射 |
| scripts/moss_tts.py、heygen_api.py | 调用自己的MOSS/HeyGen账号，无付费提交自动重试 |
| scripts/make_soft_cue.py | 生成原创轻提示音；无第三方音频再分发问题 |

可先查看[30秒无声动效预览](examples/continuous-motion-demo.mp4)，了解模板的默认语法。它不是数字人成片。

同片风格是默认预设，不锁死你的品牌色、主题或片长。想获得类似效果，应让助手读完整规范、从模板改编，并检查真实导出；只发一句“加点高级动效”不能替代制作过程。

## 验证范围

参考成片实际使用MOSS、HeyGen、Whisper、Remotion、Lucide和FFmpeg完成，包含人物小窗与连续解释动画，最终270.8秒成片已获创作者认可。此认可不等于每个新账号、新声音或新素材都已验证。

本次分享版本另外运行了模板的配置检查、时间映射测试及30秒实际试渲染，检查实际输出关键画面；API客户端沿用已实测版本，打包时没有重新消耗MOSS或HeyGen额度。技术检查不能代替新项目的完整听看与用户选择。

公开Skill包不含作者照片、声音、音色ID、私有API返回、密钥、签名下载链接或系统字体。Lucide图标附ISC许可；Remotion、生成服务及你另加的素材遵守各自许可。此前成片用过的第三方音效原文件不作为音效库打包分享。
