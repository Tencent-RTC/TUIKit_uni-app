import { ref } from "vue";
import {
    SendLikeOptions
} from "@/uni_modules/ui-component";
// 响应式状态

const totalLikeCount = ref();
const latestSender = ref();

// 管理器实例
import { getV2RTCRoomEngineManager } from "./v2RTCRoomEngine";
/**
 * 通用的UTS函数调用方法
 * @param funcName UTS函数名
 * @param args 函数参数，包含success和fail callback，直接传递对象
 */
function callUTSFunction(funcName: string, args?: any) {
    // 创建默认的日志callback
    const defaultCallback = {
        success: (res?: string) => {
            console.log(`[${funcName}] Success:`, {
                funcName,
                args: JSON.stringify(args),
                result: res,
            });
        },
        fail: (errCode?: number, errMsg?: string) => {
            console.error(`[${funcName}] Failed:`, {
                funcName,
                args: JSON.stringify(args),
                errCode,
                errMsg,
            });
        },
    };

    // 准备最终的参数对象
    let finalArgs = args || {};

    // 如果args中没有callback，则添加默认callback
    if (!finalArgs.success && !finalArgs.fail) {
        finalArgs = {
            ...finalArgs,
            ...defaultCallback,
        };
    }

    // 直接调用UTS层
    try {
        console.log(`[${funcName}] Calling with args:`, finalArgs);

        // 直接传递对象给UTS层
        getV2RTCRoomEngineManager()[funcName](finalArgs);
    } catch (error) {
        console.error(`[${funcName}] Error calling UTS function:`, error);
        // 如果有失败回调，调用它
        if (finalArgs.fail) {
            finalArgs.fail(-1, `Failed to call ${funcName}: ${error}`);
        }
    }
}

// 方法封装 - callback直接在params中
function sendLike(params: SendLikeOptions) {
    callUTSFunction("sendLike", params);
}



const onlLikeStateChanged = (eventName: string, res: string) => {
    try {
        if (eventName === "totalLikeCount") {
            const data = JSON.parse(res);
            totalLikeCount.value = data;
        }
        if (eventName === "latestSender") {
            const data = JSON.parse(res);
            latestSender.value = data;
        }
    } catch (error) {
        console.error("onlLikeStateChanged JSON parse error:", error);
    }
};

// 事件绑定
function bindEvent(liveId: string) {
    getV2RTCRoomEngineManager().on("likeStateChanged", onlLikeStateChanged, liveId);
}

// 导出 Composition API
export function useLikeState(liveId: string) {
    bindEvent(liveId);
    return {
        // 响应式状态
        sendLike,
        totalLikeCount,
        latestSender,
        // 通用UTS调用方法
        callUTSFunction,

        // 事件管理
        bindEvent,
    };
}
export default useLikeState;
