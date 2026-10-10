function normalize2(x, z) {
  const length = Math.hypot(x, z);
  if (length <= 1e-9) return { x: 0, z: 0 };
  if (length <= 1) return { x, z };
  return { x: x / length, z: z / length };
}

export function cameraRelativeIntent(input, cameraForward, cameraRight) {
  const localX = Number(input?.x) || 0;
  const localZ = Number(input?.z) || 0;
  const forwardAmount = -localZ;
  const x = (Number(cameraRight?.x) || 0) * localX + (Number(cameraForward?.x) || 0) * forwardAmount;
  const z = (Number(cameraRight?.z) || 0) * localX + (Number(cameraForward?.z) || 0) * forwardAmount;
  return normalize2(x, z);
}

export function keyboardIntent(keys) {
  return {
    x: (keys?.ArrowRight || keys?.d ? 1 : 0) - (keys?.ArrowLeft || keys?.a ? 1 : 0),
    z: (keys?.ArrowDown || keys?.s ? 1 : 0) - (keys?.ArrowUp || keys?.w ? 1 : 0),
  };
}
