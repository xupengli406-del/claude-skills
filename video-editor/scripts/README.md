# video-editor scripts

模板脚本，供 skill 执行时参考和复制到工作目录使用。

| 脚本 | 用途 |
|------|------|
| `transcribe.py` | Whisper 语音转录 → transcripts.json |
| `edit_video.py` | FFmpeg 剪辑拼接 → final.mp4 |
| `generate_srt.py` | 生成 SRT 字幕（含 ASR 纠错）|
| `burn_subtitles.py` | 烧录硬字幕 → subtitled.mp4 |

## 使用方式

这些脚本是模板，执行 skill 时会根据实际素材和剪辑方案自动生成对应的工作脚本。核心参数（CLIPS 列表、纠错表、输出尺寸等）需根据每次任务动态填充。
