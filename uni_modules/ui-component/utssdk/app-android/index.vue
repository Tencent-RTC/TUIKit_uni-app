<template>
  <view class="defaultStyles"> </view>
</template>
<script lang="uts">
import LiveRenderView from 'uts.sdk.modules.uiComponent.kotlin.LiveRenderView';
import Log from "android.util.Log"

const STREAM_TAG = "StreamView"
let liveId: Any = ""

export default {
    name: "stream-view",
    props: {
        "liveId": {
            type: Any,
            default: ""
        }
    }, 
    watch: {
        "liveId": {
            handler(newValue : Any, oldValue : Any) {
                console.log(`StreamView liveId newValue, ${newValue}`);
                Log.e(STREAM_TAG, "StreamView liveId newValue, " + newValue)
                liveId = newValue
                this.$el?.updateRenderView(newValue)
            },
            immediate: true // 创建时是否通过此方法更新属性，默认值为false
        },
    },
    created() {
        console.log(`StreamView created`);
        Log.e(STREAM_TAG,"StreamView created ")
    },
    NVLoad() : LiveRenderView {
        let streamView = new LiveRenderView($androidContext!)
        streamView.updateRenderView(liveId)
        console.log(`StreamView NVLoad, ${streamView}`);
        Log.e(STREAM_TAG,"StreamView NVLoad ")
        return streamView;
    },
    NVLoaded() {
        console.log(`StreamView NVLoaded, ${UTSAndroid.devicePX2px(1080)}`);
        Log.e(STREAM_TAG,"StreamView NVLoaded ")
    },
    NVLayouted() {
        console.log(`StreamView NVLayouted`);
        Log.e(STREAM_TAG,"StreamView NVLayouted ")
    },
    NVUpdateStyles(styles : Map<String, any>) {
        console.log(`StreamView NVUpdateStyles, ${styles}`);
        Log.e(STREAM_TAG,"StreamView NVUpdateStyles ")
    },
    NVBeforeUnload() {
        console.log(`StreamView NVBeforeUnload`);
        Log.e(STREAM_TAG,"StreamView NVBeforeUnload ")
    },
    NVUnloaded() {
        console.log(`StreamView NVUnloaded`);
        Log.e(STREAM_TAG,"StreamView NVUnloaded ")
    },
    unmounted() {
        console.log(`StreamView unmounted`);
        Log.e(STREAM_TAG,"StreamView unmounted ")
    }
}
</script>

<style>
/* 定义默认样式值, 组件使用者没有配置时使用 */
.defaultStyles {
  background-color: white;
}
</style>
