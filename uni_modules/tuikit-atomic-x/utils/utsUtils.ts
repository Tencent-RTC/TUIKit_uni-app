import { getRTCRoomEngineManager } from "../state/rtcRoomEngine";

/**
 * 安全的JSON解析函数
 * @param jsonString JSON字符串
 * @param defaultValue 解析失败时的默认值
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("JSON parse error:", error);
        return defaultValue;
    }
}

/**
 * 通用的UTS函数调用方法
 * @param funcName UTS函数名
 * @param args 函数参数，包含success和fail callback，直接传递对象
 */
export function callUTSFunction(funcName: string, args?: any): void {
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
        getRTCRoomEngineManager()[funcName](finalArgs);
    } catch (error) {
        console.error(`[${funcName}] Error calling UTS function:`, error);
        // 如果有失败回调，调用它
        if (finalArgs.fail) {
            finalArgs.fail(-1, `Failed to call ${funcName}: ${error}`);
        }
    }
}