<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import { UIView } from 'UIKit';

    const STREAM_TAG : String = "LiveRenderView"

    export default {
        name: "live-core-view",
        props: {
            "liveID": {
                type: String,
                default: ""
            },
            "viewType": {
                type: String,
                default: ""
            },
        },
        watch: {
            "liveID": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${STREAM_TAG} liveID newValue, ${newValue}`);
                    this.$el.updateRenderView(newValue)
                },
                immediate: true
            },
            "viewType": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${STREAM_TAG} viewType newValue, ${newValue}`);
                    this.$el.updateViewType(newValue)
                },
                immediate: true
            },
        },
        created() {
            console.log(`${STREAM_TAG} created`);
        },
        NVBeforeLoad() {
        },
        NVLoad() : LiveRenderView {
            let streamView = new LiveRenderView();
            console.log(`${STREAM_TAG} NVLoad, ${streamView}, ${this.liveID}`);
            return streamView;
        },
        NVLoaded() {
            console.log(`${STREAM_TAG} NVLoaded, ${this.liveID}`);
            if (this.liveID.length > 0) {
                this.$el.updateViewType(this.viewType)
                this.$el.updateRenderView(this.liveID);
            }
        },
        NVLayouted() {
        },
        NVUnloaded() {
            console.log(`${STREAM_TAG} LiveCoreView NVUnloaded`);
        },
        unmounted() {
            console.log(`${STREAM_TAG} LiveCoreView unmounted`);
        }
    }
</script>

<style>
    /* 定义默认样式值, 组件使用者没有配置时使用 */
    .defaultStyles {
        background-color: white;
    }
</style>