---
name: video-presenter
description: >-
  讲解视频生成器：基于 Hyperframes + edge-tts 自动生成带动画和字幕的深色风格讲解视频。
  输入内容大纲（标题+要点+旁白文案），自动完成 TTS 语音合成、HTML 合成文件编写、
  GSAP 入场动画、Hyperframes 逐帧渲染、SRT 字幕生成与烧录。
  当用户需要为 skill/产品/框架/教程制作讲解视频时使用。
argument-hint: "[主题名称] [场景数] [每场景：标题+要点+旁白文案]"
user-invocable: true
---

# 讲解视频生成器

你是一个专业的讲解视频制作助手。将用户提供的内容大纲（结构化知识、产品介绍、框架说明等）自动转化为带动画效果和中文字幕的深色风格讲解视频。

## 技术栈

- **TTS**: edge-tts (`zh-CN-YunxiNeural`)，中文语音合成
- **合成**: Hyperframes HTML composition + GSAP timeline 动画
- **渲染**: Hyperframes render engine（无头 Chrome 逐帧截图 + FFmpeg 编码）
- **字幕**: SRT 生成 + FFmpeg subtitles filter 烧录

## 前置要求

- Node.js >= 22
- FFmpeg
- Python 3 + `edge-tts` (`pip install edge-tts`)
- Hyperframes CLI (`npm install -g hyperframes`)
- Hyperframes Chrome（首次运行 `hyperframes browser ensure`）

## 输入

用户提供：
- 主题名称
- 内容大纲：每个场景包含标题、副标题、4个要点、旁白文案
- 风格偏好（可选，默认深色高端）
- 输出目录（可选）

## 工作流程

### Step 1: 准备脚本

将用户内容组织为场景列表，每场景包含：
```python
{
    "title": "场景标题",
    "subtitle": "副标题/描述",
    "badge": "STEP 1 / 4",  # 角标
    "color": "#FCA311",       # 场景主色
    "bullets": ["要点1", "要点2", "要点3", "要点4"],
    "narration": "该场景的旁白文案（供 TTS 朗读）"
}
```

颜色方案建议（深色主题）：
- 金色 `#FCA311` — 综述/总结
- 红色 `#E5383B` — 阶段1/警告/验证
- 橙色 `#FF9F1C` — 阶段2/过渡
- 青色 `#2EC4B6` — 阶段3/增长
- 蓝灰 `#778DA9` — 阶段4/成熟
- 紫色 `#8E44AD` — 核心/分析
- 绿色 `#27AE60` — 执行/输出
- 蓝色 `#3498DB` — 技术/工具

### Step 2: 生成 TTS 音频

使用 edge-tts 为每个场景生成中文语音：

```python
import asyncio, edge_tts, os

VOICE = 'zh-CN-YunxiNeural'
RATE = '+0%'  # 正常语速，可调 +5% 加快

async def gen_audio(text, output_path):
    """生成单段 TTS 音频，失败自动重试"""
    for attempt in range(3):
        try:
            c = edge_tts.Communicate(text, VOICE, rate=RATE)
            await c.save(output_path)
            return
        except Exception as e:
            if attempt < 2:
                await asyncio.sleep(2)
            else:
                raise

async def main(scenes, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    for i, scene in enumerate(scenes):
        path = os.path.join(output_dir, f'scene{i+1}.mp3')
        print(f'Generating scene{i+1}.mp3...')
        await gen_audio(scene['narration'], path)
        await asyncio.sleep(1)  # 避免速率限制
    print('TTS done!')

asyncio.run(main(scenes, output_dir))
```

### Step 3: 获取音频时长

用 ffprobe 获取每段音频的精确时长，用于计算时间线：

```python
import subprocess

def get_duration(path):
    r = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
        capture_output=True, text=True
    )
    return float(r.stdout.strip())
```

### Step 4: 计算时间线

每个场景的时间安排：
- `start_time` = 前一场景结束 + 0.5s 过渡间隔
- `audio_start` = `start_time` + 0.8s（留入场动画时间）
- `duration` = `audio_duration` + 2.5s（含入场 + 尾部留白）
- `anim_start` = `start_time` + 0.2s

### Step 5: 编写 Hyperframes HTML 合成文件

创建 `index.html`，结构如下：

```html
<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="composition-id" data-composition-id="composition-id"
     data-start="0" data-duration="TOTAL_DURATION"
     data-width="1920" data-height="1080">

  <!-- 音频轨道 -->
  <audio id="a1" data-start="AUDIO_START" data-duration="AUDIO_DUR"
         data-track-index="10" src="scene1.mp3" data-volume="1"></audio>
  <!-- ...更多音频... -->

  <!-- 场景（每个场景一个 div） -->
  <div id="s1" class="clip scene" data-start="0" data-duration="SCENE_DUR"
       data-track-index="0">
    <div class="scene-content">
      <div class="progress-bar" id="s1-progress"></div>
      <div class="scene-badge" style="color: ACCENT;">BADGE</div>
      <h1 class="scene-title" id="s1-title" style="color: ACCENT;">标题</h1>
      <p class="scene-subtitle" id="s1-sub">副标题</p>
      <div class="divider" id="s1-div" style="background: ACCENT;"></div>
      <div class="bullets-container">
        <div class="bullet-card" id="s1-b1">
          <span class="bullet-dot" style="background:ACCENT;"></span>要点1
        </div>
        <!-- b2, b3, b4 -->
      </div>
    </div>
    <div class="deco-glow deco-glow-1"></div>
  </div>
  <!-- ...更多场景... -->

  <style>/* 见下方样式模板 */</style>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>/* 见下方动画模板 */</script>
</div>
</body>
</html>
```

#### 样式模板（深色高端风格）

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

#composition-id {
  position: relative;
  width: 1920px; height: 1080px;
  overflow: hidden;
  background: #0D1B2A;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.scene {
  position: absolute;
  top: 0; left: 0;
  width: 1920px; height: 1080px;
  overflow: hidden;
}

.scene-content {
  display: flex; flex-direction: column;
  width: 100%; height: 100%;
  padding: 80px 140px; gap: 16px;
  box-sizing: border-box;
  position: relative; z-index: 2;
}

.progress-bar {
  position: absolute; top: 0; left: 0;
  height: 4px; z-index: 10;
}

.scene-badge {
  font-size: 20px; font-weight: 500;
  letter-spacing: 3px; opacity: 0.8;
}

.scene-title {
  font-size: 64px; font-weight: 900;
  line-height: 1.2; margin-top: 8px;
}

.scene-subtitle {
  font-size: 28px; font-weight: 300;
  color: #778DA9; margin-top: 4px;
}

.divider {
  width: 50%; height: 2px;
  margin: 12px 0; border-radius: 1px;
}

.bullets-container {
  display: flex; flex-direction: column;
  gap: 18px; margin-top: 20px;
}

.bullet-card {
  display: flex; align-items: center; gap: 16px;
  background: rgba(27, 38, 59, 0.8);
  border-radius: 10px; padding: 18px 28px;
  font-size: 30px; font-weight: 400;
  color: #E0E1DD;
  border: 1px solid rgba(65, 90, 119, 0.3);
}

.bullet-dot {
  width: 12px; height: 12px;
  border-radius: 50%; flex-shrink: 0;
}

.deco-glow {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  pointer-events: none; z-index: 1;
  background: radial-gradient(circle, rgba(252,163,17,0.12) 0%, transparent 70%);
}
.deco-glow-1 { top: -100px; right: -100px; }
```

#### 动画模板（GSAP）

每个场景的入场动画模式：

```javascript
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });

// 对每个场景 s(N)，在 anim_start 时间点添加入场动画：
// 注意：不要用模板字面量 ${} ，必须硬编码选择器字符串！

// 光晕呼吸
tl.fromTo("#s1 .deco-glow-1",
  { scale: 0.8, opacity: 0 },
  { scale: 1.2, opacity: 1, duration: 2, ease: "sine.inOut" }, ANIM_START);

// 角标
tl.from("#s1 .scene-badge",
  { y: -30, opacity: 0, duration: 0.5, ease: "power3.out" }, ANIM_START + 0.2);

// 标题（上滑入场）
tl.from("#s1-title",
  { y: 50, opacity: 0, duration: 0.7, ease: "expo.out" }, ANIM_START + 0.3);

// 副标题
tl.from("#s1-sub",
  { y: 30, opacity: 0, duration: 0.5, ease: "power2.out" }, ANIM_START + 0.5);

// 分隔线（从左展开）
tl.from("#s1-div",
  { scaleX: 0, opacity: 0, duration: 0.6, ease: "power3.out",
    transformOrigin: "left center" }, ANIM_START + 0.6);

// 进度条
tl.from("#s1-progress",
  { scaleX: 0, duration: 0.8, ease: "power2.out",
    transformOrigin: "left center" }, ANIM_START + 0.1);

// 要点卡片交错入场（间隔 0.2s）
tl.from("#s1-b1", { x: -60, opacity: 0, duration: 0.5, ease: "power3.out" }, ANIM_START + 0.9);
tl.from("#s1-b2", { x: -60, opacity: 0, duration: 0.5, ease: "power2.out" }, ANIM_START + 1.1);
tl.from("#s1-b3", { x: -60, opacity: 0, duration: 0.5, ease: "expo.out" }, ANIM_START + 1.3);
tl.from("#s1-b4", { x: -60, opacity: 0, duration: 0.5, ease: "power3.out" }, ANIM_START + 1.5);

// 最后一个场景淡出
tl.to("#sN .scene-content",
  { opacity: 0, duration: 1.2, ease: "power2.in" }, FADE_OUT_TIME);

window.__timelines["composition-id"] = tl;
```

**关键规则：**
- 每个 `tl.from()` / `tl.to()` 选择器必须是硬编码字符串，**禁止使用模板字面量 `${}`**
- 不同场景的要点使用不同 ease（power3.out / power2.out / expo.out 交替）
- 最后一幕在音频结束前 1.5s 开始淡出

### Step 6: Lint 检查

```bash
cd <project-dir>
hyperframes lint
```

确保 0 errors, 0 warnings。常见问题：
- `template_literal_selector` → 把 `${var}` 替换为硬编码字符串
- `composition_self_attribute_selector` → 用 `#id` 替代 `[data-composition-id="..."]`

### Step 7: 渲染视频

```bash
hyperframes render --output output.mp4 --quality standard
```

渲染参数：
- `--quality draft` 快速迭代
- `--quality standard` 正式输出（默认）
- `--quality high` 最终交付
- `--fps 30` 默认帧率

### Step 8: 生成字幕 SRT

根据音频时间线和旁白文案生成 SRT 文件：

```python
def format_time(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    ms = int((s % 1) * 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

def gen_srt(scenes_timing, output_path, chars_per_line=20):
    """
    scenes_timing: [{start, duration, text}, ...]
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        idx = 1
        for seg in scenes_timing:
            text = seg['text']
            start = seg['start']
            dur = seg['duration']
            lines = [text[i:i+chars_per_line] for i in range(0, len(text), chars_per_line)]
            cd = dur / len(lines) if lines else dur
            for i, line in enumerate(lines):
                ls = start + i * cd
                le = start + (i + 1) * cd
                f.write(f"{idx}\n{format_time(ls)} --> {format_time(le)}\n{line}\n\n")
                idx += 1
```

### Step 9: 烧录字幕

```bash
ffmpeg -y -i output.mp4 \
  -vf "subtitles='output.srt':force_style='FontSize=22,FontName=Microsoft YaHei,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=50'" \
  -c:v libx264 -preset medium -crf 20 \
  -c:a copy -movflags +faststart \
  final.mp4
```

字幕样式：白字 + 黑色描边 + 底部居中（MarginV=50）。

### Step 10: 清理

删除中间文件，只保留：
- 最终视频（带字幕）
- `hf-<name>/index.html`（可重渲染的源文件）

## 输出

- `<名称>_HF.mp4` — 最终成品视频（1920×1080，H.264 + AAC，带烧录字幕）
- `hf-<name>/index.html` — Hyperframes 合成源文件（可用 `hyperframes preview` 预览）

## 注意事项

- edge-tts 有速率限制，每段音频间隔 1-2 秒生成
- 旁白文案不宜过长（每段 < 100 字），否则 TTS 可能超时
- 首次渲染需下载 Chrome（~100MB），`hyperframes browser ensure` 确保就绪
- 中文字体使用 Noto Sans SC（Google Fonts 自动加载），备用 Microsoft YaHei
- 合成文件中不要使用 JavaScript 模板字面量选择器
