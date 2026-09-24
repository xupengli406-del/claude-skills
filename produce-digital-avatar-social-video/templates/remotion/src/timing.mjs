export const clamp = (x) => Math.max(0, Math.min(1, x));
export const ease = (t, at, duration = 1.1) => {
  const p = clamp((t - at) / duration);
  return p * p * (3 - 2 * p);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const frame = (seconds, fps) => Math.round(seconds * fps);
export function sourceTime(t, segment) {
  if (t < segment.from || t >= segment.to) return null;
  return segment.sourceFrom + (t - segment.from) * (segment.rate ?? 1);
}
export function rectAt(t, keyframes) {
  if (t <= keyframes[0].at) return keyframes[0].rect;
  for (let i = 1; i < keyframes.length; i++) {
    const a = keyframes[i - 1], b = keyframes[i];
    if (t < b.at) return a.rect.map((v, j) => mix(v, b.rect[j], ease(t, a.at, b.at - a.at)));
  }
  return keyframes.at(-1).rect;
}
