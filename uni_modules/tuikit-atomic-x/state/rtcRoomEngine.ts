import { RTCRoomEngineManager } from "@/uni_modules/tuikit-atomic-x";

let instance : RTCRoomEngineManager | null = null;

//TODO: 这个文件的命名待讨论，或者直接干掉这个类？
export function getRTCRoomEngineManager() : RTCRoomEngineManager {
    if (!instance) {
        instance = new RTCRoomEngineManager();
    }
    return instance;
}