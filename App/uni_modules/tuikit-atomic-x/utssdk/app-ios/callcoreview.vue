<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import { UIView } from 'UIKit';

    const CALL_TAG : String = "CallRenderView"

    export default {
        name: "call-core-view",
        props: {
            "layoutTemplate": {
                type: String,
                default: "Grid"
            },
            "waitingAnimation": {
                type: String,
                default: ""
            },
            "volumeLevelIcons": {
                type: UTSJSONObject,
                default: () : UTSJSONObject => {
                    return {}
                }
            },
            "networkQualityIcons": {
                type: UTSJSONObject,
                default: () : UTSJSONObject => {
                    return {}
                }
            },
            "participantAvatars": {
                type: UTSJSONObject,
                default: () : UTSJSONObject => {
                    return {}
                }
            }
        },
        watch: {
            "layoutTemplate": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${CALL_TAG} layoutTemplate changed:`, newValue);
                    this.$el.setLayoutTemplate(newValue)
                },
                immediate: true
            },
            "waitingAnimation": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${CALL_TAG} waitingAnimation changed:`, newValue);
                    this.$el.setWaitingAnimation(newValue as Any)
                },
                immediate: true
            },
            "volumeLevelIcons": {
                handler(newValue : UTSJSONObject, oldValue : UTSJSONObject) {
                    console.log(`${CALL_TAG} volumeLevelIcons changed:`, newValue);
                    this.$el.setVolumeLevelIcons(JSON.stringify(newValue) as Any)
                },
                immediate: true,
                deep: true
            },
            "networkQualityIcons": {
                handler(newValue : UTSJSONObject, oldValue : UTSJSONObject) {
                    console.log(`${CALL_TAG} networkQualityIcons changed:`, newValue);
                    this.$el.setNetworkQualityIcons(JSON.stringify(newValue) as Any)
                },
                immediate: true,
                deep: true
            },
            "participantAvatars": {
                handler(newValue : UTSJSONObject, oldValue : UTSJSONObject) {
                    console.log(`${CALL_TAG} participantAvatars changed:`, newValue);
                    this.$el.setParticipantAvatars(JSON.stringify(newValue) as Any)
                },
                immediate: true,
                deep: true
            }
        },
        created() {
            console.log(`${CALL_TAG} created`);
        },
        NVBeforeLoad() {
            console.log(`${CALL_TAG} NVBeforeLoad`);
        },
        NVLoad() : CallRenderView {
            console.log(`${CALL_TAG} NVLoad`);
            
            let callView = new CallRenderView();
            
            return callView;
        },
        NVLoaded() {
            console.log(`${CALL_TAG} NVLoaded`);
            
            this.$el.setLayoutTemplate(this.layoutTemplate as Any)
            
            if (this.waitingAnimation.length > 0) {
                this.$el.setWaitingAnimation(this.waitingAnimation as Any)
            }
            
            this.$el.setVolumeLevelIcons(JSON.stringify(this.volumeLevelIcons) as Any)
            this.$el.setNetworkQualityIcons(JSON.stringify(this.networkQualityIcons) as Any)
            this.$el.setParticipantAvatars(JSON.stringify(this.participantAvatars) as Any)
        },
        NVLayouted() {
            console.log(`${CALL_TAG} NVLayouted`);
        },
        NVUnloaded() {
            console.log(`${CALL_TAG} NVUnloaded`);
        },
        unmounted() {
            console.log(`${CALL_TAG} unmounted`);
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
