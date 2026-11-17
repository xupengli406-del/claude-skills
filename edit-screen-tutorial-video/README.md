# 电脑录屏与资料讲解（杂志风）

**适合什么输入：** 真实电脑录屏、引用原片、文章或资料，以及已有讲解录音和可选的真人小窗素材。

**得到什么：** 以真实操作和资料为主屏的暖灰黑杂志风教程，保留可操作步骤、双语字幕、封面与四平台发布包；按本次需要交付。

**什么时候选：** 观众主要看操作过程、原片或资料，希望看清输入、步骤、反馈和结果。人物现场为主选真人随手拍；明确手绘画板或多人访谈时保留专项。

**从哪里开始：** 打开 [SKILL.md](SKILL.md)。只有想法先写稿与录制清单；已有录屏直接制作。按输入→操作→结果→验收组织演示，保留真实原声、操作因果、源到成片映射和三秒真实钩子。

使用 `edit-screen-tutorial-video`，不要求另装真人Skill。混合真人与录屏按主要观看任务确定一次负责人，分段切换构图，共用同一母音频和发布包；两包不互调整套流程。

## 独立使用

[屏幕构图](references/screen-layout.md)、[屏幕动作](references/screen-motion.md)、[陪看](references/screen-commentary.md)与[教程组织](references/tutorial-planning.md)在本包。共同字幕、声音、封面、四平台、39方法/8配方、V24组件、SRT与源剪辑模板也都在本包，不要求安装真人Skill。

工具条件在使用处检查：Python、FFmpeg/FFprobe，实际ASR才加载Whisper；编辑/渲染器、字体和源媒体按当前工程准备。模板默认写当前工程或 `--workdir`，不能把普通字幕烧录称为V24字号动画。历史案例与14原证据记录只是来源依据；原证据不随公共包分发，新包未据此声称做过端到端视频制作。

来源及许可分别保留在内置方法、节奏许可和源剪辑ORIGIN；不统称所有代码/媒体都MIT。制作授权不等于自动上传、充值或合成新发言。

## 共同模块维护

本包共同文件由真人主源的明确白名单在构建时派发，`distribution/shared-video-lock.json` 逐文件记录哈希。不要在生成副本里各改一套。维护源更新后重新同步；独立检查运行 `python scripts/sync_shared_video.py --check --target .`，只读本包lock与文件，不读取兄弟目录。布局和入口是本流程自己的文件，不从共同字幕规则继承。

## 看效果

[历史录屏教程](https://github.com/xupengli406-del/claude-skills/releases/download/video-skill-cases-2026-11-17/05a-screen-tutorial-history.mp4)：390.434秒、1920×1080、30fps，展示真实操作与资料主屏、真人小窗和双语字幕。输入、结果和当前使用方式见[案例说明](examples/screen-tutorial-history/README.md)。

片中旧Skill名和安装入口仅为历史展示，不作当前安装教材，也不是新拆分录屏包的端到端实测。[学习库页面](https://my.feishu.cn/wiki/VNszw6X52imETWkoQNYcSQnCnag)保留相应教程和字幕，访问需要学习库权限。
