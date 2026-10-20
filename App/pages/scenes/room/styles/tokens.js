export const ROOM_TOKENS = {
  colorBrand: '#0468FC',
  colorBrandDeep: '#1C66E5',
  colorDanger: '#F2504B',
  colorWarning: '#FF7200',
  lightTextPlaceholder: '#C2C7D0',
  lightTextTertiary: '#6B7385',
  darkTextPlaceholder: '#C5CCDC',
  fontSizeBase: '28rpx',
  fontSizeXl: '32rpx',
};

export function roomPlaceholderStyle(color, fontSize) {
  return `color: ${color}; font-size: ${fontSize};`;
}
