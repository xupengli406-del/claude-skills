# 文字转动画讲解

提供一段文字或场景大纲、标题要点与旁白文案，制作由图形、文字与动画解释内容的视频。当前流程默认edge-tts通用中文合成旁白，交付带字幕视频及可编辑HyperFrames工程。

新手可先从文字动画认识视频制作，再按需要加入自己的声音、照片数字人或真实录像。完整选用顺序见[视频制作怎么选](references/video-workflow-selection.md)。

## 从哪里开始

把主题与大纲交给助手，明确每个场景要解释什么：

> 用 $video-presenter 把【文字或大纲】做成动画讲解。先核对标题、要点和旁白，再按最终声音组织动画与字幕；保留可编辑工程。

执行入口见[SKILL.md](SKILL.md)。需要自己的声音带动动态图形时选择[用自己的声音做动画讲解](https://github.com/xupengli406-del/produce-voiceover-mg-social-video)；需要照片人物开口时选择[照片开口：数字人口播](https://github.com/xupengli406-del/claude-skills/tree/main/produce-digital-avatar-social-video)。

## 需要什么

Node.js 22+、Python 3与edge-tts、FFmpeg/ffprobe，以及当前可用的HyperFrames和浏览器运行环境。字体与输入资料应有权使用，实际可用性在制作时核对。

## 制作与检查

按实际旁白时长编排场景，锁定字幕与关键词发声锚点，再渲染带动态字幕的可编辑工程。正式制作需落实前三秒真实钩子及按发声锚点放大关键词；包内SRT烧录示例只提供普通字幕，不能代替动态强调与真实导出检查。已有工程按当前素材和用户指定范围继续。

当前包提供制作说明与代码示例；案例展示以实际可访问成片为准。
