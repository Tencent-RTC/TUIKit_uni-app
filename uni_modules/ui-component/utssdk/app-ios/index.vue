<template>
	<view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import { UIView } from 'UIKit';

    const STREAM_TAG : String = "StreamView"

    export default {
        name: "stream-view",
        props: {
            "liveId": {
                type: String,
                default: ""
            }
        }, 
        watch: {
            "liveId": {
                handler(newValue : String, oldValue : String) {
                    console.log(`StreamView liveId newValue, ${newValue}`);
                    this.$el.updateRenderView(newValue)
                },
                immediate: true
            },
        },
        created() {
            console.log(`${STREAM_TAG} LiveRenderView created`);
        },
        NVBeforeLoad() {
            // console.log(`${STREAM_TAG} LiveRenderView NVBeforeLoad`);
        },
        NVLoad() : LiveRenderView {
            let streamView = new LiveRenderView();
            console.log(`${STREAM_TAG} LiveRenderView NVLoad, ${streamView}, ${this.liveId}`);
            return streamView;
        },
        NVLoaded() {
            console.log(`${STREAM_TAG} LiveRenderView NVLoaded, ${this.liveId}`);
            if (this.liveId.length > 0) {
                this.$el.updateRenderView(this.liveId);
            }
        },
        NVLayouted() {
            // console.log(`${STREAM_TAG}LiveRenderView NVLayouted`);
        },
        NVBeforeUnload() {
            // console.log(`${STREAM_TAG} LiveRenderView NVBeforeUnload`);
        },
        NVUnloaded() {
            console.log(`${STREAM_TAG} LiveRenderView NVUnloaded`);
        },
        unmounted() {
            console.log(`${STREAM_TAG} LiveRenderView unmounted`);
        }
    }
</script>

<style>
	/* 定义默认样式值, 组件使用者没有配置时使用 */
	.defaultStyles {
		background-color: white;
	}
</style>