/**
 * 时区选项
 *
 */
export type TimezoneOption = {
  value: number;
  label: string;
  offsetMinutes: number;
};

function formatGmt(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}:${m < 10 ? `0${m}` : String(m)}`;
}

const RAW: [number, string][] = [
  [-720, '国际日期变更线西时间'],
  [-660, '纽埃标准时间'],
  [-660, '萨摩亚标准时间'],
  [-600, '夏威夷-阿留申标准时间'],
  [-600, '库克群岛标准时间'],
  [-570, '马克萨斯群岛标准时间'],
  [-540, '阿拉斯加标准时间'],
  [-540, '甘比尔群岛标准时间'],
  [-480, '美国太平洋标准时间'],
  [-480, '墨西哥西北部标准时间'],
  [-420, '美国山区标准时间'],
  [-420, '墨西哥太平洋标准时间'],
  [-360, '美国中部标准时间'],
  [-360, '墨西哥中部标准时间'],
  [-360, '中美洲标准时间'],
  [-300, '美国东部标准时间'],
  [-300, '哥伦比亚标准时间'],
  [-300, '秘鲁标准时间'],
  [-300, '厄瓜多尔标准时间'],
  [-300, '古巴标准时间'],
  [-270, '委内瑞拉标准时间'],
  [-240, '加拿大大西洋标准时间'],
  [-240, '智利标准时间'],
  [-240, '玻利维亚标准时间'],
  [-240, '巴拉圭标准时间'],
  [-210, '加拿大纽芬兰标准时间'],
  [-180, '巴西利亚标准时间'],
  [-180, '阿根廷标准时间'],
  [-180, '乌拉圭标准时间'],
  [-180, '法属圭亚那标准时间'],
  [-120, '南乔治亚标准时间'],
  [-120, '费尔南多迪诺罗尼亚标准时间'],
  [-60, '亚速尔群岛标准时间'],
  [-60, '佛得角标准时间'],
  [0, '协调世界时'],
  [0, '格林威治标准时间'],
  [0, '西欧标准时间'],
  [0, '摩洛哥标准时间'],
  [60, '中欧标准时间'],
  [60, '西非标准时间'],
  [120, '东欧标准时间'],
  [120, '南非标准时间'],
  [120, '中非标准时间'],
  [120, '埃及标准时间'],
  [120, '以色列标准时间'],
  [180, '莫斯科标准时间'],
  [180, '阿拉伯标准时间'],
  [180, '东非标准时间'],
  [180, '土耳其标准时间'],
  [180, '白俄罗斯标准时间'],
  [210, '伊朗标准时间'],
  [240, '海湾标准时间'],
  [240, '阿塞拜疆标准时间'],
  [240, '格鲁吉亚标准时间'],
  [240, '亚美尼亚标准时间'],
  [240, '毛里求斯标准时间'],
  [240, '萨马拉标准时间'],
  [270, '阿富汗标准时间'],
  [300, '巴基斯坦标准时间'],
  [300, '乌兹别克斯坦标准时间'],
  [300, '土库曼斯坦标准时间'],
  [300, '叶卡捷琳堡标准时间'],
  [330, '印度标准时间'],
  [330, '斯里兰卡标准时间'],
  [345, '尼泊尔标准时间'],
  [360, '孟加拉国标准时间'],
  [360, '哈萨克斯坦东部标准时间'],
  [360, '不丹标准时间'],
  [360, '鄂木斯克标准时间'],
  [390, '缅甸标准时间'],
  [390, '科科斯群岛标准时间'],
  [420, '中南半岛标准时间'],
  [420, '印度尼西亚西部标准时间'],
  [420, '克拉斯诺亚尔斯克标准时间'],
  [480, '中国标准时间'],
  [480, '香港标准时间'],
  [480, '台北标准时间'],
  [480, '新加坡标准时间'],
  [480, '马来西亚标准时间'],
  [480, '菲律宾标准时间'],
  [480, '文莱标准时间'],
  [480, '印度尼西亚中部标准时间'],
  [480, '澳大利亚西部标准时间'],
  [480, '蒙古标准时间'],
  [480, '伊尔库茨克标准时间'],
  [525, '澳大利亚中西部标准时间'],
  [540, '日本标准时间'],
  [540, '韩国标准时间'],
  [540, '印度尼西亚东部标准时间'],
  [540, '帕劳标准时间'],
  [540, '雅库茨克标准时间'],
  [570, '澳大利亚中部标准时间'],
  [600, '澳大利亚东部标准时间'],
  [600, '查摩罗标准时间'],
  [600, '巴布亚新几内亚标准时间'],
  [600, '符拉迪沃斯托克标准时间'],
  [630, '豪勋爵岛标准时间'],
  [660, '所罗门群岛标准时间'],
  [660, '新喀里多尼亚标准时间'],
  [660, '瓦努阿图标准时间'],
  [660, '诺福克岛标准时间'],
  [660, '马加丹标准时间'],
  [720, '新西兰标准时间'],
  [720, '斐济标准时间'],
  [720, '图瓦卢标准时间'],
  [720, '马绍尔群岛标准时间'],
  [720, '堪察加标准时间'],
  [765, '查塔姆群岛标准时间'],
  [780, '汤加标准时间'],
  [780, '托克劳标准时间'],
  [840, '莱恩群岛标准时间'],
];

export const TIMEZONE_OPTIONS: TimezoneOption[] = RAW.map((item, index) => ({
  value: index,
  label: `(${formatGmt(item[0])}) ${item[1]}`,
  offsetMinutes: item[0],
}));

export function getDeviceOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export function getDefaultTimezoneIndex(): number {
  const offset = getDeviceOffsetMinutes();
  const hit = TIMEZONE_OPTIONS.find((o) => o.offsetMinutes === offset);
  if (hit) return hit.value;
  const fallback = TIMEZONE_OPTIONS.find((o) => o.offsetMinutes === 480);
  return fallback ? fallback.value : 0;
}

export function getTimezoneLabel(index: number): string {
  const hit = TIMEZONE_OPTIONS[index];
  return hit ? hit.label : '';
}

export function wallClockToUtcMs(wallClockMs: number, timezoneIndex: number): number {
  const tz = TIMEZONE_OPTIONS[timezoneIndex];
  if (!tz) return wallClockMs;
  const deltaMinutes = getDeviceOffsetMinutes() - tz.offsetMinutes;
  return wallClockMs + deltaMinutes * 60 * 1000;
}

export function utcToWallClockMs(utcMs: number, timezoneIndex: number): number {
  const tz = TIMEZONE_OPTIONS[timezoneIndex];
  if (!tz) return utcMs;
  const deltaMinutes = getDeviceOffsetMinutes() - tz.offsetMinutes;
  return utcMs - deltaMinutes * 60 * 1000;
}
