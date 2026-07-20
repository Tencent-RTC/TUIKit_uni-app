import { formatDuration, JSONToObject } from './index';

export function isCallSignaling(message: any) {
    const callMessage: any = JSONToObject(message.payload.data);
    if (callMessage?.actionType) {
        return true;
    }
    return false;
}

export function handleCallKitSignaling(message: any) {
    if (!message || !message.payload) {
        return { callTip: '', callType: '' }
    }
    const callMessage: any = JSONToObject(message.payload.data);
    const objectData = JSONToObject(callMessage?.data);
    const callType = objectData.call_type;
    let callTip = '';
    switch (callMessage?.actionType) {
        case 1: {
            if (objectData?.data?.cmd === 'hangup') {
                callTip = `通话时长: ${formatDuration(Number(objectData?.call_end))}`;
            } else {
                callTip = "发起通话";
            }
        }
            break;

        case 2:
            callTip = message?.flow === 'out' ? "已取消" : "对方已取消";
            break;

        case 4:
            if (objectData?.line_busy === 'line_busy' || objectData?.data?.message === 'lineBusy') {
                if (message?.flow === 'out') {
                    callTip = "对方忙线中";
                } else {
                    callTip = "忙线未接听";
                }
            } else {
                if (message?.flow === 'out') {
                    callTip = "对方已拒绝";
                } else {
                    callTip = "已拒绝";
                }
            }
            break;
        case 5:
            callTip = message?.flow === 'out' ? "对方无应答" : "超时无应答";
            break;
        default:
            callTip = '';
            break;
    }

    return {
        callTip,
        callType
    }
}