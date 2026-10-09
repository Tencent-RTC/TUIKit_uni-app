interface InputSegment {
  type: string;   // 'char' | 'emoji'
  text?: string;  // char
  src?: string;   // emoji url
}

interface TextRun {
  type: string;
  text: string;
}

interface EmojiRun {
  type: string;
  src: string;
}

type LineRun = TextRun | EmojiRun;
type MessageLine = LineRun[];

interface WrapOptions {
  line0AvailPx: number;                    // 首行可用宽（已扣除徽章/主播/昵称等头部）
  lineNAvailPx: number;                    // 后续行可用宽（整条内容宽）
  emojiPx: number;                         // 单个表情占宽（含右边距）
  measureCharPx: (ch: string) => number;   // 单字符测宽（由 textMeasurer 提供）
}

const wrapSegmentsIntoLines = (segments: InputSegment[], opts: WrapOptions): MessageLine[] => {
  const line0AvailPx = opts.line0AvailPx;
  const lineNAvailPx = opts.lineNAvailPx;
  const emojiPx = opts.emojiPx;
  const measureCharPx = opts.measureCharPx;

  const lines: MessageLine[] = [];
  let current: MessageLine = [];
  lines.push(current);
  let lineIdx = 0;
  let used = 0;
  let avail = line0AvailPx;

  const pushRun = (seg: InputSegment) => {
    if (seg.type === 'emoji') {
      current.push({ type: 'emoji', src: seg.src || '' } as EmojiRun);
      return;
    }
    const last = current.length > 0 ? current[current.length - 1] : null;
    if (last && last.type === 'text') {
      (last as TextRun).text += (seg.text || '');
    } else {
      current.push({ type: 'text', text: seg.text || '' } as TextRun);
    }
  };

  const newLine = () => {
    current = [];
    lines.push(current);
    lineIdx++;
    used = 0;
    avail = lineNAvailPx;
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const w = seg.type === 'emoji' ? emojiPx : measureCharPx(seg.text || '');
    if (used + w > avail) {
      // 首行头部过宽(如超长昵称)时也允许空首行换行,让内容从第二行整宽开始;非空行才换,避免死循环。
      const canGainByWrap = lineIdx === 0 && lineNAvailPx > avail;
      if (current.length > 0 || canGainByWrap) {
        newLine();
      }
    }
    pushRun(seg);
    used += w;
  }

  return lines;
};

export type { InputSegment, TextRun, EmojiRun, LineRun, MessageLine, WrapOptions };
export { wrapSegmentsIntoLines };
