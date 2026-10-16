export function resolveRendererMode(search = '') {
  const params = new URLSearchParams(search || '');
  return params.get('renderer') === '3d' ? 'world3d' : 'cinematic';
}
