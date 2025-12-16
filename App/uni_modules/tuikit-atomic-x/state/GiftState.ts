/**
 * @module GiftState
 * @module_description
 * 礼物系统管理模块
 * 核心功能：处理礼物的发送、接收、礼物列表管理等功能，支持礼物分类、礼物动画、礼物统计等完整礼物经济系统。
 * 技术特点：支持礼物动画渲染、礼物特效处理、礼物统计、礼物排行榜等高级功能。
 * 业务价值：为直播平台提供核心的变现能力，支持礼物经济、虚拟货币等商业模式。
 * 应用场景：礼物打赏、虚拟货币、礼物特效、礼物统计等商业化场景。
 */
import { ref } from "vue";
import { ILiveListener, RefreshUsableGiftsOptions, SendGiftOptions, SetLanguageOptions } from "@/uni_modules/tuikit-atomic-x";
import { getRTCRoomEngineManager } from "./rtcRoomEngine";
import { callUTSFunction, safeJsonParse } from "../utils/utsUtils";

/**
 * 礼物参数类型定义
 * @typedef {Object} GiftParam
 * @property {String} giftID - 礼物唯一标识
 * @property {String} name - 礼物名称
 * @property {String} desc - 礼物描述
 * @property {String} iconURL - 礼物图标URL
 * @property {String} resourceURL - 礼物动画资源URL
 * @property {number} level - 礼物等级
 * @property {number} coins - 礼物价格（金币）
 * @property {Map<String, String>} extensionInfo - 扩展信息
 * @memberof module:GiftState
 */
export type GiftParam = {
  giftID : String;
  name : String;
  desc : String;
  iconURL : String;
  resourceURL : String;
  level : number;
  coins : number;
  extensionInfo : Map<String, String>;
};

/**
 * 礼物分类参数类型定义
 * @typedef {Object} GiftCategoryParam
 * @property {string} [categoryID] - 分类ID
 * @property {string} [name] - 分类名称
 * @property {string} [desc] - 分类描述
 * @property {Map<string, string>} [extensionInfo] - 扩展信息
 * @property {GiftParam[]} [giftList] - 分类下的礼物列表
 * @memberof module:GiftState
 */
export type GiftCategoryParam = {
  categoryID ?: string;
  name ?: string;
  desc ?: string;
  extensionInfo ?: Map<string, string>;
  giftList ?: GiftParam[];
};

/**
 * 可用礼物列表
 * @type {Ref<GiftCategoryParam[]>}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { usableGifts } = useGiftState('your_live_id');
 * 
 * // 监听可用礼物列表变化
 * watch(usableGifts, (newGifts) => {
 *   if (newGifts && newGifts.length > 0) {
 *     console.log('可用礼物更新:', newGifts);
 *     newGifts.forEach(gift => {
 *       console.log('礼物ID:', gift.giftID);
 *       console.log('礼物名称:', gift.name);
 *       console.log('礼物价格:', gift.coins);
 *     });
 *   }
 * });
 * 
 * // 获取当前可用礼物列表
 * const gifts = usableGifts.value;
 * console.log('当前可用礼物数量:', gifts.length);
 */
const usableGifts = ref<GiftCategoryParam[]>([]);

/**
 * 刷新可用礼物列表
 * @param {RefreshUsableGiftsOptions} params - 刷新礼物列表参数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { refreshUsableGifts } = useGiftState("your_live_id");
 * refreshUsableGifts({});
 */
function refreshUsableGifts(params : RefreshUsableGiftsOptions) : void {
  callUTSFunction("refreshUsableGifts", params);
}

/**
 * 发送礼物
 * @param {SendGiftOptions} params - 发送礼物参数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { sendGift } = useGiftState("your_live_id")
 * sendGift({ liveID: 'xxx', giftID: "gift001", count: 1 }); 
 */
function sendGift(params : SendGiftOptions) : void {
  callUTSFunction("sendGift", params);
}

/**
 * 设置礼物语言
 * @param {SetLanguageOptions} params - 设置礼物语言参数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { setLanguage } = useGiftState("your_live_id")
 * setLanguage({ liveID: 'xxx', language: "zh-CN",}); 
 */
function setLanguage(params : SetLanguageOptions) : void {
  callUTSFunction("setLanguage", params);
}

/**
 * 添加礼物事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveGift'(收到礼物)
 * @param {ILiveListener} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { addGiftListener } = useGiftState("your_live_id")
 * addGiftListener('your_live_id', 'onReceiveGift', {
 * 	callback: (params) => {
 * 		console.log('result:', params);
 * 	}
 * });
 */
function addGiftListener(liveID : string, eventName : string, listener : ILiveListener) : void {
  getRTCRoomEngineManager().addGiftListener(liveID, eventName, listener);
}

/**
 * 移除礼物事件监听器
 * @param {string} liveID - 直播间ID
 * @param {string} eventName - 事件名称，可选值: 'onReceiveGift'(收到礼物)
 * @param {ILiveListener} listener - 事件监听器函数
 * @returns {void}
 * @memberof module:GiftState
 * @example
 * import { useGiftState } from '@/uni_modules/tuikit-atomic-x/state/GiftState';
 * const { removeGiftListener } = useGiftState("your_live_id")
 * removeGiftListener('your_live_id', 'onReceiveGift', giftListener);
 */
function removeGiftListener(liveID : string, eventName : string, listener : ILiveListener) : void {
  getRTCRoomEngineManager().removeGiftListener(liveID, eventName, listener);
}

const onGiftStoreChanged = (eventName : string, res : string) : void => {
  try {
    if (eventName === "usableGifts") {
      const data = safeJsonParse<GiftCategoryParam[]>(res, []);
      usableGifts.value = data;
    }
  } catch (error) {
    console.error("onGiftStoreChanged JSON parse error:", error);
  }
};

function bindEvent(liveID : string) : void {
  getRTCRoomEngineManager().on("giftStoreChanged", onGiftStoreChanged, liveID);
}

export function useGiftState(liveID : string) {
  bindEvent(liveID);
  return {
    usableGifts,         // 可用礼物列表

    refreshUsableGifts,  // 刷新可用礼物列表
    sendGift,            // 发送礼物
    setLanguage,         // 设置礼物语言
    addGiftListener,     // 添加礼物事件监听
    removeGiftListener   // 移除礼物事件监听
  };
}
export default useGiftState;