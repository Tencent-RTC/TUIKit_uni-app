import type { func } from '../type';

export const isUndefined = function (input: any) {
  return typeof input === 'undefined';
};

export const isPlainObject = function (input: any) {
  // 注意不能使用以下方式判断，因为IE9/IE10下，对象的__proto__是 undefined
  // return isObject(input) && input.__proto__ === Object.prototype;
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(input);
  if (proto === null) { // edge case Object.create(null)
    return true;
  }
  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  // 原型链第一个和最后一个比较
  return proto === baseProto;
};

export const isArray = function (input: any) {
  if (typeof Array.isArray === 'function') {
    return Array.isArray(input);
  }
  return (Object as any).prototype.toString.call(input).match(/^\[object (.*)\]$/)[1].toLowerCase() === 'array';
};

export const isPrivateKey = function (key: string) {
  return key.startsWith('_');
};

export const isUrl = function (url: string) {
  return /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/.test(url);
};

export const calculateTimeAgo = function (dateTimeStamp: number, t: func): string {
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const now = new Date().getTime();
  const diffValue = now - dateTimeStamp;
  let result = '';

  if (diffValue < 0) {
    return result;
  }
  const minC = diffValue / minute;
  const hourC = diffValue / hour;
  const dayC = diffValue / day;
  const weekC = diffValue / week;
  if (weekC >= 1 && weekC <= 4) {
    result = ` ${parseInt(`${weekC}`, 10)} ${t('time.周')}${t('time.前')}`;
  } else if (dayC >= 1 && dayC <= 6) {
    result = ` ${parseInt(`${dayC}`, 10)} ${t('time.天')}${t('time.前')}`;
  } else if (hourC >= 1 && hourC <= 23) {
    result = ` ${parseInt(`${hourC}`, 10)} ${t('time.小时')}${t('time.前')}`;
  } else if (minC >= 1 && minC <= 59) {
    result = ` ${parseInt(`${minC}`, 10)} ${t('time.分钟')}${t('time.前')}`;
  } else if (diffValue >= 0 && diffValue <= minute) {
    result = `${t('time.刚刚')}`;
  } else {
    const dateTime = new Date();
    dateTime.setTime(dateTimeStamp);
    const _year = dateTime.getFullYear();
    const _month = dateTime.getMonth() + 1 < 10 ? `0${dateTime.getMonth() + 1}` : dateTime.getMonth() + 1;
    const _date = dateTime.getDate() < 10 ? `0${dateTime.getDate()}` : dateTime.getDate();
    result = `${_year}-${_month}-${_date}`;
  }
  return result;
};

export function formatTime(secondTime: number) {
  const time: number = secondTime;
  let newTime = '';
  let hour: number | string;
  let minute: number | string;
  let seconds: any;
  if (time >= 3600) {
    hour = parseInt(`${time / 3600}`, 10) < 10 ? `0${parseInt(`${time / 3600}`, 10)}` : parseInt(`${time / 3600}`, 10);
    minute = parseInt(`${(time % 60) / 60}`, 10) < 10 ? `0${parseInt(`${(time % 60) / 60}`, 10)}` : parseInt(`${(time % 60) / 60}`, 10);
    seconds = time % 3600 < 10 ? `0${time % 3600}` : time % 3600;
    if (seconds > 60) {
      minute = parseInt(`${seconds / 60}`, 10) < 10 ? `0${parseInt(`${seconds / 60}`, 10)}` : parseInt(`${seconds / 60}`, 10);
      seconds = seconds % 60 < 10 ? `0${seconds % 60}` : seconds % 60;
    }
    newTime = `${hour}:${minute}:${seconds}`;
  } else if (time >= 60 && time < 3600) {
    minute = parseInt(`${time / 60}`, 10) < 10 ? `0${parseInt(`${time / 60}`, 10)}` : parseInt(`${time / 60}`, 10);
    seconds = time % 60 < 10 ? `0${time % 60}` : time % 60;
    newTime = `00:${minute}:${seconds}`;
  } else if (time < 60) {
    seconds = time < 10 ? `0${time}` : time;
    newTime = `00:00:${seconds}`;
  }
  return newTime;
}

// Determine if it is a JSON string
export function isJSON(str: string) {
  if (typeof str === 'string') {
    try {
      const data = JSON.parse(str);
      if (data) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  return false;
}

// Determine if it is a JSON string
export const JSONToObject = function (str: string) {
  if (!str || !isJSON(str)) {
    return str;
  }
  return JSON.parse(str);
};

// formate file size
export const formateFileSize = function (fileSize: number) {
  let ret = '';
  if (fileSize >= 1024 * 1024) {
    ret = `${(fileSize / (1024 * 1024)).toFixed(2)} Mb`;
  } else if (fileSize >= 1024) {
    ret = `${(fileSize / 1024).toFixed(2)} Kb`;
  } else {
    ret = `${fileSize.toFixed(2)}B`;
  }
  return ret;
};

/**
 * 重试函数, catch 时，重试
 *
 * @param {Promise} promise 需重试的函数
 * @param {number} num 需要重试的次数
 * @param {number} time 间隔时间（s）
 * @returns {Promise<any>} im 接口的 response 原样返回
 */
export const retryPromise = (promise: Promise<any>, num = 6, time = 0.5) => {
  let n = num;
  const func = () => promise;
  return func()
    .catch((error: any) => {
      if (n === 0) {
        throw error;
      }
      const timer = setTimeout(() => {
        func();
        clearTimeout(timer);
        n--;
      }, time * 1000);
    });
};
