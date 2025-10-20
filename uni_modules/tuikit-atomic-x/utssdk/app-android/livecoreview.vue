<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import LiveRenderView from 'uts.sdk.modules.atomicx.kotlin.LiveRenderView';
    import Log from "android.util.Log"

    const STREAM_TAG = "LiveRenderView"
    let liveID : Any = ""

    export default {
        name: "live-core-view",
        props: {
            "liveID": {
                type: Any,
                default: ""
            },
            "viewType": {
                type: String,
                default: "PLAY_VIEW"
            },
        },
        watch: {
            "liveID": {
                handler(newValue : Any, oldValue : Any) {
                    console.log(`${STREAM_TAG} liveID newValue, ${newValue}`);
                    Log.e(STREAM_TAG, "liveID newValue, " + newValue)
                    liveID = newValue
                    this.$el?.updateRenderView(newValue)
                },
                immediate: true // 创建时是否通过此方法更新属性，默认值为false
            },
            "viewType": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${STREAM_TAG} liveID newValue, ${newValue}`);
                    this.$el?.updateViewType(newValue)
                },
                immediate: true
            },
        },
        created() {
            console.log(`${STREAM_TAG} created`);
            Log.e(STREAM_TAG, "created ")
        },
        NVLoad() : LiveRenderView {
            let streamView = new LiveRenderView($androidContext!)
            streamView.updateRenderView(liveID)
            console.log(`${STREAM_TAG} NVLoad, ${streamView}`);
            Log.e(STREAM_TAG, "NVLoad ")
            return streamView;
        },
        NVLoaded() {
            console.log(`${STREAM_TAG} NVLoaded`);
            Log.e(STREAM_TAG, "NVLoaded ")
        },
        NVLayouted() {
        },
        NVBeforeUnload() {
        },
        NVUnloaded() {
            console.log(`${STREAM_TAG} NVUnloaded`);
            Log.e(STREAM_TAG, "NVUnloaded ")
        },
        unmounted() {
            console.log(`${STREAM_TAG} unmounted`);
            Log.e(STREAM_TAG, "unmounted ")
        }
    }
</script>

<style>
    /* 定义默认样式值, 组件使用者没有配置时使用 */
    .defaultStyles {
        background-color: white;
    }
</style>