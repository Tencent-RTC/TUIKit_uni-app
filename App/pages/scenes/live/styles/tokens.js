export const LIVE_TOKENS = {
  colorBrandLight: '#4A9EFF',
  colorTextInverse: '#FFFFFF',
  darkSurface14: 'rgba(255, 255, 255, 0.14)',
  darkSurface16: 'rgba(255, 255, 255, 0.16)',
  darkText50: 'rgba(255, 255, 255, 0.5)',
};

export function livePlaceholderStyle(color, fontSize) {
  const style = `color: ${color};`;
  return fontSize ? `${style} font-size: ${fontSize};` : style;
}
