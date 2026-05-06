"""
SRT 字幕生成模板
根据 transcripts.json 和剪辑时间线生成 SRT 字幕文件。

使用前需修改：
- BASE_DIR: 工作目录
- CLIPS: 与 edit_video.py 相同的时间线
- CORRECTIONS: ASR 纠错映射表
"""
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 剪辑时间线 (与 edit_video.py 一致)
CLIPS = [
    # ("example.mp4", start_sec, end_sec),
]

# ASR 纠错表: {错误识别: 正确文字}
CORRECTIONS = {
    # "错误词": "正确词",
}


def apply_corrections(text):
    for wrong, correct in CORRECTIONS.items():
        text = text.replace(wrong, correct)
    return text


def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    with open(os.path.join(BASE_DIR, "transcripts.json"), "r", encoding="utf-8") as f:
        transcripts = json.load(f)

    subtitles = []
    timeline_offset = 0.0

    for clip_file, clip_start, clip_end in CLIPS:
        clip_duration = clip_end - clip_start
        segments = transcripts[clip_file]["segments"]

        for seg in segments:
            if seg["end"] <= clip_start or seg["start"] >= clip_end:
                continue
            actual_start = max(seg["start"], clip_start)
            actual_end = min(seg["end"], clip_end)
            final_start = timeline_offset + (actual_start - clip_start)
            final_end = timeline_offset + (actual_end - clip_start)
            if final_end - final_start < 0.3:
                continue
            text = apply_corrections(seg["text"].strip())
            if text:
                subtitles.append((final_start, final_end, text))

        timeline_offset += clip_duration

    # 合并相邻的短字幕
    merged = []
    for start, end, text in subtitles:
        if merged and start - merged[-1][1] < 0.3 and len(merged[-1][2]) + len(text) < 30:
            merged[-1] = (merged[-1][0], end, merged[-1][2] + text)
        else:
            merged.append([start, end, text])

    # 写入 SRT
    srt_path = os.path.join(BASE_DIR, "output.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        for i, (start, end, text) in enumerate(merged, 1):
            f.write(f"{i}\n{format_time(start)} --> {format_time(end)}\n{text}\n\n")

    print(f"Generated {len(merged)} subtitle entries -> {srt_path}")


if __name__ == "__main__":
    main()
