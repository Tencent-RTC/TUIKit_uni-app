<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import CameraTestRenderView from 'uts.sdk.modules.atomicx.kotlin.CameraTestRenderView';

    export default {
        name: "camera-test-view",
        props: {
            "viewID": {
                type: String,
                default: ""
            },
            "cornerRadius": {
                type: Number,
                default: 0
            }
        },
        watch: {
            "viewID": {
                handler(newValue : String, oldValue : String) {
                    this.$el?.setViewID(newValue)
                },
                immediate: true
            },
            "cornerRadius": {
                handler(newValue : number, oldValue : number) {
                    this.$el?.setCornerRadius(newValue)
                },
                immediate: true
            }
        },
        NVLoad() : CameraTestRenderView {
            let cameraTestView = new CameraTestRenderView($androidContext!)
            cameraTestView.setViewID(this.viewID)
            cameraTestView.setCornerRadius(this.cornerRadius)
            return cameraTestView;
        },
        methods: {
        }
    }
</script>

<style>
    .defaultStyles {
        width: 100%;
        height: 100%;
        background-color: transparent;
    }
</style>
