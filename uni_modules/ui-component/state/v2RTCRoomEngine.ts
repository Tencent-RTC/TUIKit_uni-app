import { V2RTCRoomEngineManager } from "@/uni_modules/ui-component";

let instance: V2RTCRoomEngineManager | null = null;

export function getV2RTCRoomEngineManager(): V2RTCRoomEngineManager {
    if (!instance) {
        instance = new V2RTCRoomEngineManager();
    }
    return instance;
}
