<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import { UIView } from 'UIKit';

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
                    this.$el.setViewID(newValue as Any)
                },
                immediate: true
            },
            "cornerRadius": {
                handler(newValue : number, oldValue : number) {
                    this.$el.setCornerRadius(newValue as Any)
                },
                immediate: true
            }
        },
        NVLoad() : CameraTestRenderView {
            return new CameraTestRenderView();
        },
        NVLoaded() {
            if (this.viewID.length > 0) {
                this.$el.setViewID(this.viewID as Any)
            }
            this.$el.setCornerRadius(this.cornerRadius as Any)
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
