"""
Whisper 语音转录模板
用法: python transcribe.py [视频目录路径]
输出: transcripts.json (带时间戳的转录结果)
"""
import whisper
import json
import os
import sys
import glob

def main():
    base_dir = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()

    # 扫描视频文件
    extensions = ("*.mp4", "*.mov", "*.avi", "*.mkv")
    files = []
    for ext in extensions:
        files.extend(glob.glob(os.path.join(base_dir, ext)))
    files = [os.path.basename(f) for f in files]

    if not files:
        print(f"No video files found in {base_dir}")
        return

    print(f"Found {len(files)} video files, loading Whisper model...")
    model = whisper.load_model("small")

    results = {}
    for f in files:
        print(f"Transcribing: {f}")
        path = os.path.join(base_dir, f)
        result = model.transcribe(path, language="zh", word_timestamps=True)
        results[f] = {
            "text": result["text"],
            "segments": [
                {
                    "start": round(seg["start"], 2),
                    "end": round(seg["end"], 2),
                    "text": seg["text"],
                }
                for seg in result["segments"]
            ]
        }
        print(f"  -> {result['text'][:80]}...")

    output_path = os.path.join(base_dir, "transcripts.json")
    with open(output_path, "w", encoding="utf-8") as fp:
        json.dump(results, fp, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(results)} transcripts to: {output_path}")

if __name__ == "__main__":
    main()
