"""
字幕烧录模板
将 SRT 字幕硬烧到视频中。

使用前需修改：
- INPUT: 无字幕视频路径
- SRT: SRT 字幕文件路径
- OUTPUT: 输出路径
"""
import subprocess
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(BASE_DIR, "output_final.mp4")
SRT = os.path.join(BASE_DIR, "output.srt")
OUTPUT = os.path.join(BASE_DIR, "output_subtitled.mp4")

# Windows 路径转义
srt_escaped = SRT.replace("\\", "/").replace(":", "\\:")

# 字幕样式 (可调整)
STYLE = "FontSize=20,FontName=Microsoft YaHei,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=30"

cmd = [
    "ffmpeg", "-y",
    "-i", INPUT,
    "-vf", f"subtitles='{srt_escaped}':force_style='{STYLE}'",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-c:a", "copy",
    "-movflags", "+faststart",
    OUTPUT
]

print("Burning subtitles...")
result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if result.returncode != 0:
    print(f"ERROR: {result.stderr.decode('utf-8', errors='ignore')[-500:]}")
else:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", OUTPUT],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    dur = float(probe.stdout.decode().strip())
    size = os.path.getsize(OUTPUT) / (1024 * 1024)
    print(f"Done: {dur:.1f}s ({dur/60:.1f}min) | {size:.1f}MB | {OUTPUT}")
