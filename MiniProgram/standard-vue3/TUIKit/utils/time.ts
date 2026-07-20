export function calculateTimestamp(timestamp: number): string {
  const todayZero = new Date().setHours(0, 0, 0, 0);
  const thisYear = new Date(
    new Date().getFullYear(),
    0,
    1,
    0,
    0,
    0,
    0,
  ).getTime();
  const target = new Date(timestamp*1000);

  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const diff = todayZero - target.getTime();

  function formatNum(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  if (diff <= 0) {
    // today, only display hour:minute
    return `${formatNum(target.getHours())}:${formatNum(target.getMinutes())}`;
  } else if (diff <= oneDay) {
    // yesterday, display yesterday:hour:minute
    return `昨天 ${formatNum(
      target.getHours(),
    )}:${formatNum(target.getMinutes())}`;
  } else if (diff <= oneWeek - oneDay) {
    // Within a week, display weekday hour:minute
    const weekdays = [
      '星期日',
      '星期一',
      '星期二',
      '星期三',
      '星期四',
      '星期五',
      '星期六',
    ];
    const weekday = weekdays[target.getDay()];
    return `${weekday} ${formatNum(
      target.getHours(),
    )}:${formatNum(target.getMinutes())}`;
  } else if (target.getTime() >= thisYear) {
    // Over a week, within this year, display mouth/day hour:minute
    return `${target.getMonth() + 1}月${target.getDate()}日 ${formatNum(
      target.getHours(),
    )}:${formatNum(target.getMinutes())}`;
  } else {
    // Not within this year, display year/mouth/day hour:minute
    return `${target.getFullYear()}年${
      target.getMonth() + 1
    }月${target.getDate()}日 ${formatNum(target.getHours())}:${formatNum(
      target.getMinutes(),
    )}`;
  }
}
