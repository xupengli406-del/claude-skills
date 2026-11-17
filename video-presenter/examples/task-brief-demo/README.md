# 把一句模糊需求变成可执行任务

本轮新做演示，待用户看效果。

[60秒动画成片](https://github.com/xupengli406-del/claude-skills/releases/download/video-skill-cases-2026-11-17/01-text-to-animation-task-brief.mp4)

![本轮实际导出的首帧](cover-first-frame.jpg)

这张图取自实际导出的第一帧，用于预览文字与画面风格。

## 输入与结果

从一句“帮我做个PPT”出发，依次补齐四项：给谁看、用什么材料、交付什么、如何检查。图形和任务编辑器随旁白推进，最后把四项组合成一条可以执行、可以核对的任务写法。

旁白为通用Microsoft Yunxi合成声音；画面由文字和图形动画组成，没有本人音色、真人实拍或数字人。这条视频演示需求写法，没有实际制作或测评示例里的PPT。

## 怎样用同类输入开始

> 用 $video-presenter，把“帮我做个PPT”讲成一条60秒动画。前三秒直接点出模糊要求的问题，再依次解释给谁看、材料、交付物与检查方式。用通用合成旁白，画面和双语字幕跟随实际声音，保留可编辑工程。

执行入口见[SKILL.md](../../SKILL.md)。本例最后组合的任务是：

> 请根据这份销售表，为部门周会制作5页中文PPT。包含趋势、渠道对比和待确认的问题。保存为可编辑文件。完成后列出数据来源和文件位置，等待我核对。

## 成片与运行信息

60.000秒，1920×1080，30fps；H.264视频，48kHz立体声AAC。通用声音为Microsoft `zh-CN-YunxiNeural`，edge-tts 7.3.1，语速+0%；画面使用HyperFrames 0.9.59与GSAP 3.14.2。开头直接出现问题，正文随声音依次展示四项，已内嵌双语字幕与关键词字号动效。

## 字幕附件

- [中文字幕](https://github.com/xupengli406-del/claude-skills/releases/download/video-skill-cases-2026-11-17/01-text-to-animation-task-brief.zh.srt)
- [英文字幕](https://github.com/xupengli406-del/claude-skills/releases/download/video-skill-cases-2026-11-17/01-text-to-animation-task-brief.en.srt)
- [中英双语字幕](https://github.com/xupengli406-del/claude-skills/releases/download/video-skill-cases-2026-11-17/01-text-to-animation-task-brief.zh-en.srt)

成片已经内嵌字幕，SRT用于外挂或继续编辑，不必再叠一层。SRT保存文字与时间，动态字号效果以视频为准。
