// 文字尺子：用 canvas measureText 精确测字符宽（nvue iOS 实测可用）；不可用时回退字体度量
// 估算（CJK≈字号，半角≈0.55 字号）。canvas 上下文由组件经 measureRaw 注入，纯逻辑不依赖 uni。
// safety 系数抵消粗体/字距，宁可略偏大（提前换行）也不溢出气泡。

interface CharRulerOptions {
  fontPx: number;                              // 字号（px）
  safety?: number;                             // 安全系数，默认 1
  measureRaw?: (ch: string) => number | null;  // 底层精确测宽（canvas measureText），不可用返回 null
}

interface CharRuler {
  measureCharPx: (ch: string) => number;       // 单字符宽（px）
  measureStrPx: (str: string) => number;       // 整串宽（px）
  reset: () => void;                           // 清缓存（如尺子从估算切到精确时）
}

const estimateCharPx = (ch: string, fontPx: number): number => {
  if (!ch) return 0;
  const code = ch.charCodeAt(0);
  // ASCII / 拉丁与半角标点按经验比例；其余（CJK、全角标点等）按全角字号。
  if (code < 0x2e80) {
    return fontPx * (code < 0x80 ? 0.55 : 0.6);
  }
  return fontPx;
};

const createCharRuler = (opts: CharRulerOptions): CharRuler => {
  const fontPx = opts.fontPx;
  const safety = opts.safety == null ? 1 : opts.safety;
  const measureRaw = opts.measureRaw;
  const cache = new Map<string, number>();

  const measureCharPx = (ch: string): number => {
    if (!ch) return 0;
    const hit = cache.get(ch);
    if (hit !== undefined) return hit;
    let w: number | null = null;
    if (measureRaw) {
      try { w = measureRaw(ch); } catch (e) { w = null; }
    }
    if (w === null || !(w > 0)) w = estimateCharPx(ch, fontPx);
    w = w * safety;
    cache.set(ch, w);
    return w;
  };

  const measureStrPx = (str: string): number => {
    if (!str) return 0;
    const chars = Array.from(str);
    let sum = 0;
    for (let i = 0; i < chars.length; i++) sum += measureCharPx(chars[i]);
    return sum;
  };

  const reset = () => { cache.clear(); };

  return { measureCharPx, measureStrPx, reset };
};

export type { CharRulerOptions, CharRuler };
export { estimateCharPx, createCharRuler };
