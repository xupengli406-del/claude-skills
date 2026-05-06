---
name: video-editor
description: >-
  视频剪辑工作流：从多段原始素材中剪辑出流畅视频并配字幕。
  自动安装 FFmpeg + Whisper，转录语音，分析内容，去除气口/口误/重复，
  按指定时长要求剪辑拼接，生成并烧录字幕。当用户需要剪辑视频、拼接视频片段、
  添加字幕、去除口误或气口时使用。
argument-hint: "[视频文件目录路径] [时长要求] [开头台词/脚本]"
user-invocable: true
---

# 视频剪辑工作流

你是一个专业的视频剪辑助手。你的工作是将多段原始视频素材剪辑成一段流畅、紧凑的成品视频，并配上准确的字幕。

## 输入

用户会提供：
- 视频素材所在目录
- 时长要求（如"3分钟以内"）
- 开头台词/脚本（可选）
- 其他剪辑要求（如"去掉气口"、"保持竖屏"等）

## 工作流程

### Step 0: 环境检查与安装

检查并安装必要工具：

```python
# 检查 FFmpeg
ffmpeg -version

# 检查 Whisper
python -c "import whisper"

# 如果缺少，安装：
# FFmpeg: winget install Gyan.FFmpeg (Windows) / brew install ffmpeg (Mac)
# Whisper: pip install openai-whisper
```

安装后务必刷新 PATH：
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Step 1: 素材扫描

扫描目录中所有视频文件（.mp4/.mov/.avi），获取每段的：
- 分辨率（宽x高）→ 判断横屏/竖屏
- 时长（秒）
- 帧率
- 总素材时长

使用 ffprobe：
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 [file]
ffprobe -v error -show_entries format=duration -of csv=p=0 [file]
```

### Step 2: 语音转录（Whisper）

使用 scripts/transcribe.py 模板对所有视频进行语音转录：
- 使用 "small" 模型（中文识别较好的平衡点）
- 启用 word_timestamps 获取精确时间戳
- 指定 language="zh"
- 输出 transcripts.json（带 segments 时间戳）

关键代码：
```python
import whisper
model = whisper.load_model("small")
result = model.transcribe(path, language="zh", word_timestamps=True)
```

### Step 3: 内容分析与剪辑决策

基于转录结果，分析并决定：

1. **识别内容结构**：每段视频是什么内容（开头介绍/主体讲解/演示/结尾）
2. **匹配脚本**：如果用户提供了台词，找到对应的视频片段
3. **标记剪除内容**：
   - 气口（segments之间 >1s 的间隔）
   - 重复段落（多个take中选最流畅的）
   - 口误/卡壳（如"或者说...或者说..."）
   - 废片（测试镜头、暗场等）
4. **编排时间线**：确定最终播放顺序
5. **时长控制**：计算总时长是否满足要求，不满足则进一步裁剪

输出：CLIPS 列表 `[(source_file, start_sec, end_sec, description), ...]`

### Step 4: 视频剪辑执行

使用 scripts/edit_video.py 模板执行剪辑：

**核心逻辑：**
1. 按 CLIPS 列表逐段裁剪（trim）
2. 统一分辨率/帧率/音频参数
3. 处理横竖屏混合：
   - 如果输出为横屏：竖屏素材居中 + 左右黑边（pillarbox）
   - 如果输出为竖屏：横屏素材居中 + 上下黑边（letterbox）
   - 如果所有素材同一方向：直接拼接
4. 添加微小的音频淡入淡出（0.05s）避免爆音
5. 使用 concat demuxer 拼接所有片段

**FFmpeg 关键参数：**
```bash
# 裁剪单个片段
ffmpeg -y -ss [start] -i [input] -t [duration] \
  -vf "scale=W:H,pad=W:H:(ow-iw)/2:(oh-ih)/2:black" \
  -c:v libx264 -preset fast -crf 18 \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -af "afade=t=in:st=0:d=0.05,afade=t=out:st=[dur-0.05]:d=0.05" \
  -r 30 [output]

# 拼接
ffmpeg -y -f concat -safe 0 -i filelist.txt \
  -c:v libx264 -preset medium -crf 20 \
  -c:a aac -b:a 128k -movflags +faststart [output]
```

### Step 5: 字幕生成

使用 scripts/generate_srt.py 模板：

1. 根据最终 CLIPS 时间线，将转录 segments 映射到成品视频时间轴
2. 应用 ASR 纠错表（团队名、人名、专有名词）
3. 合并过短/过近的字幕条目
4. 输出标准 SRT 格式

**纠错策略：**
- 让用户提供关键词纠错表（人名、产品名、专有名词）
- Whisper 常见中文错误模式：同音字替换、英文名识别错误、语气词误判

### Step 6: 字幕烧录

使用 scripts/burn_subtitles.py 模板：

```bash
ffmpeg -y -i [video] \
  -vf "subtitles='[srt_path]':force_style='FontSize=20,FontName=Microsoft YaHei,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=30'" \
  -c:v libx264 -preset medium -crf 20 \
  -c:a copy -movflags +faststart [output]
```

注意 Windows 路径需要转义：`path.replace("\\", "/").replace(":", "\\:")`

### Step 7: 验证

检查最终视频：
- 时长是否满足要求
- 分辨率是否正确
- 文件大小是否合理
- 提示用户播放检查

## 输出文件

最终在素材目录下生成：
- `[name]_final.mp4` — 无字幕版
- `[name].srt` — 外挂字幕文件
- `[name]_subtitled.mp4` — 带硬字幕版（最终成品）
- `transcripts.json` — 转录原始数据

## 注意事项

- Python subprocess 在 Windows 上用 `stdout=subprocess.PIPE, stderr=subprocess.PIPE` + `.decode("utf-8", errors="ignore")` 避免 GBK 编码问题
- Whisper 模型首次运行会下载（small 约 461MB），需要耐心等待
- 如果 GPU 不可用，Whisper 会自动使用 CPU（速度较慢但可用）
- 裁剪时 `-ss` 放在 `-i` 前面（input seeking）速度更快
- 每段片段都重新编码以确保拼接不出问题（不要用 -c copy 裁剪再拼接）
