"""
FFmpeg 视频剪辑拼接模板
根据 CLIPS 列表裁剪并拼接视频片段。

使用前需修改：
- BASE_DIR: 素材目录
- OUTPUT_W, OUTPUT_H: 输出分辨率
- CLIPS: 剪辑时间线
- PORTRAIT_SOURCES: 竖屏素材文件名集合
"""
import subprocess
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp_clips")
os.makedirs(TEMP_DIR, exist_ok=True)

OUTPUT_W, OUTPUT_H = 1280, 720  # 横屏输出; 竖屏改为 720, 1280

# 剪辑时间线: (源文件, 开始秒, 结束秒, 描述)
CLIPS = [
    # ("example.mp4", 0.0, 10.5, "开头介绍"),
]

# 竖屏素材文件名（如果有横竖屏混合）
PORTRAIT_SOURCES = set()


def run_cmd(cmd):
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.stdout.decode("utf-8", errors="ignore"), result.stderr.decode("utf-8", errors="ignore"), result.returncode


def trim_clip(source, start, end, output_path, is_portrait):
    duration = end - start
    if is_portrait:
        vf = f"scale=-2:{OUTPUT_H},pad={OUTPUT_W}:{OUTPUT_H}:(ow-iw)/2:0:black"
    else:
        vf = f"scale={OUTPUT_W}:{OUTPUT_H}"

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{start:.3f}",
        "-i", source,
        "-t", f"{duration:.3f}",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
        "-af", f"afade=t=in:st=0:d=0.05,afade=t=out:st={duration - 0.05:.3f}:d=0.05",
        "-avoid_negative_ts", "make_zero",
        "-r", "30",
        output_path
    ]
    _, stderr, rc = run_cmd(cmd)
    if rc != 0:
        raise RuntimeError(f"Trim failed: {stderr[-300:]}")


def concat_clips(clip_paths, output_path):
    list_file = os.path.join(TEMP_DIR, "filelist.txt")
    with open(list_file, "w", encoding="utf-8") as f:
        for path in clip_paths:
            f.write(f"file '{path}'\n")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_file,
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        output_path
    ]
    _, stderr, rc = run_cmd(cmd)
    if rc != 0:
        raise RuntimeError(f"Concat failed: {stderr[-300:]}")


def main():
    total = sum(end - start for _, start, end, _ in CLIPS)
    print(f"Expected: {total:.1f}s ({total/60:.1f}min) | Output: {OUTPUT_W}x{OUTPUT_H}")

    clip_paths = []
    for i, (src, start, end, desc) in enumerate(CLIPS):
        src_path = os.path.join(BASE_DIR, src)
        out_path = os.path.join(TEMP_DIR, f"clip_{i:02d}.mp4")
        clip_paths.append(out_path)
        is_portrait = src in PORTRAIT_SOURCES
        print(f"  [{i+1}/{len(CLIPS)}] {desc} ({end-start:.1f}s)")
        trim_clip(src_path, start, end, out_path, is_portrait)

    output = os.path.join(BASE_DIR, "output_final.mp4")
    print(f"\nConcatenating...")
    concat_clips(clip_paths, output)

    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", output]
    stdout, _, _ = run_cmd(cmd)
    dur = float(stdout.strip())
    size = os.path.getsize(output) / (1024*1024)
    print(f"Done: {dur:.1f}s | {size:.1f}MB | {output}")


if __name__ == "__main__":
    main()
