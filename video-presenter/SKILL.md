---
name: video-presenter
description: "把一段文字或场景大纲做成动画讲解：编排标题、要点与旁白，默认用edge-tts通用合成语音，使用HyperFrames逐帧渲染并制作中文字幕。适用于产品、框架或教程的文字转动画；需要本人声音时选原声MG，照片人物出镜时选数字人口播。"
argument-hint: "[主题名称] [场景数] [每场景：标题+要点+旁白文案]"
user-invocable: true
---

# 文字转动画讲解

你是一个专业的讲解视频制作助手。将用户提供的内容大纲（结构化知识、产品介绍、框架说明等）自动转化为带动画效果和中文字幕的深色风格讲解视频。

## 按成片选择流程

本包将场景大纲、标题要点与旁白文案编排成动画讲解，当前模板默认 edge-tts 中文语音；没有内置本人授权音色服务。与原声 MG、大纲动画的输入、声音和画面差异见[视频制作怎么选](references/video-workflow-selection.md)。先按画面选择，声音可以单独安排。

## 制作时的共用质量规范

新片和完整重剪先按包内[真实钩子](shared-video/references/opening-and-retention.md)确定前三秒的观看理由；字幕按[关键词放大与验收](shared-video/references/subtitles-and-motion.md)落实整句普通态、发声锚点放大、邻字让位与句末保持。下方普通SRT烧录是基础示例，正式工程仍需实现动态强调并检查实际导出。

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

### Step 6: 字幕时码与动态强调

先从锁定旁白取得实际句词时间锚点，生成交付用SRT，再把动态字幕放进同一HTML合成。可使用实际可用的TTS时间事件、ASR或forced alignment，并核对原声；下方按字符均分的代码只示范SRT格式，不能用它推断关键词发声时刻。

浏览器DOM工程可使用包内`shared-video/assets/inline-emphasis.mjs`的`createInlineEmphasis(root, config)`：等待`document.fonts.ready`后测字，配置真实`captionStart`、`captionEnd`、`anchorTime`及文本段，初始化一次；在本工程每次逐帧求值或seek时显式调用返回对象的`render(t)`，t取同一绝对音频时钟。它是单行示例，实际安全区、字号和多行布局需按本期工程适配。不能只初始化DOM或靠墙钟播放来声称随机跳转与分段渲染一致。

整句先普通态显示，到实际关键词发声点再放大并让邻字按当前宽度平滑让位，完成态保持至整条退出；下一条重新普通态。逐项验收见[包内字幕规范](shared-video/references/subtitles-and-motion.md)。下面的SRT作为侧车交付，与同一最终时钟对应。

基础SRT写入格式示例：

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

### Step 7: Lint 检查

```bash
cd <project-dir>
hyperframes lint
```

确保 0 errors, 0 warnings。常见问题：
- `template_literal_selector` → 把 `${var}` 替换为硬编码字符串
- `composition_self_attribute_selector` → 用 `#id` 替代 `[data-composition-id="..."]`

### Step 8: 渲染视频

动态字幕、场景动画和音频均接入同一工程后，按同一绝对时间逐帧渲染：

```bash
hyperframes render --output output.mp4 --quality standard
```

渲染参数：
- `--quality draft` 快速迭代
- `--quality standard` 正式输出（默认）
- `--quality high` 最终交付
- `--fps 30` 默认帧率

### Step 9: 兼容普通SRT烧录示例

正式成片优先使用步骤6接入的动态字幕。下面命令仅用于明确需要普通静态字幕的兼容输出；它本身没有V24关键词放大，不能作为完整字幕制作的默认终点。已有动态字幕画面时不再叠烧同一份普通字幕。

```bash
ffmpeg -y -i output.mp4 \
  -vf "subtitles='output.srt':force_style='FontSize=22,FontName=Microsoft YaHei,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=50'" \
  -c:v libx264 -preset medium -crf 20 \
  -c:a copy -movflags +faststart \
  final.mp4
```

字幕样式：白字 + 黑色描边 + 底部居中（MarginV=50）。

### Step 10: 清理

实际导出按用户的前三秒真实钩子、原声真实性和字幕关键词放大规范检查。基础 SRT 烧录例子不等于实现逐词发声锚点、邻字让位和句末保持；正式制作须在工程落实并检查实际导出。只清理确认废弃的临时文件，保留重渲染需要的音轨、素材、字体和来源记录，以及：
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
