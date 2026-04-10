<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import CallRenderView from 'uts.sdk.modules.atomicx.kotlin.CallRenderView';
    import Log from "android.util.Log"

    const CALL_TAG = "CallRenderView"

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
                type: Object,
                default: () => ({})
            },
            "networkQualityIcons": {
                type: Object,
                default: () => ({})
            },
            "participantAvatars": {
                type: Object,
                default: () => ({})
            }
        },
        watch: {
            "layoutTemplate": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${CALL_TAG} layoutTemplate changed:`, newValue);
                    Log.i(CALL_TAG, "layoutTemplate changed: " + newValue)
                    this.$el?.setLayoutTemplate(newValue)
                },
                immediate: true
            },
            "waitingAnimation": {
                handler(newValue : String, oldValue : String) {
                    console.log(`${CALL_TAG} waitingAnimation changed:`, newValue);
                    Log.i(CALL_TAG, "waitingAnimation changed: " + newValue)
                    this.$el?.setWaitingAnimation(newValue)
                },
                immediate: true
            },
            "volumeLevelIcons": {
                handler(newValue: Any, oldValue: Any) {
                    console.log(`${CALL_TAG} volumeLevelIcons changed:`, newValue);
                    Log.i(CALL_TAG, "volumeLevelIcons changed: " + newValue)
                    this.$el?.setVolumeLevelIcons(newValue)
                },
                immediate: true,
                deep: true
            },
            "networkQualityIcons": {
                handler(newValue: Any, oldValue: Any) {
                    console.log(`${CALL_TAG} networkQualityIcons changed:`, newValue);
                    Log.i(CALL_TAG, "networkQualityIcons changed: " + newValue)
                    this.$el?.setNetworkQualityIcons(newValue)
                },
                immediate: true,
                deep: true
            },
            "participantAvatars": {
                handler(newValue: Any, oldValue: Any) {
                    console.log(`${CALL_TAG} participantAvatars changed:`, newValue);
                    Log.i(CALL_TAG, "participantAvatars changed: " + newValue)
                    this.$el?.setParticipantAvatars(newValue)
                },
                immediate: true,
                deep: true
            }
        },
        created() {
            console.log(`${CALL_TAG} created`);
            Log.i(CALL_TAG, "created")
        },
        NVLoad() : CallRenderView {
            console.log(`${CALL_TAG} NVLoad`);
            Log.i(CALL_TAG, "NVLoad")

            let callView = new CallRenderView($androidContext!)

            callView.setLayoutTemplate(this.layoutTemplate)

            if (this.waitingAnimation != "") {
                callView.setWaitingAnimation(this.waitingAnimation)
            }

            callView.setVolumeLevelIcons(this.volumeLevelIcons)
            callView.setNetworkQualityIcons(this.networkQualityIcons)
            callView.setParticipantAvatars(this.participantAvatars)

            return callView;
        },
        NVLoaded() {
            console.log(`${CALL_TAG} NVLoaded`);
            Log.i(CALL_TAG, "NVLoaded")
        },
        NVLayouted() {
            console.log(`${CALL_TAG} NVLayouted`);
            Log.i(CALL_TAG, "NVLayouted")
        },
        NVBeforeUnload() {
            console.log(`${CALL_TAG} NVBeforeUnload`);
            Log.i(CALL_TAG, "NVBeforeUnload")
        },
        NVUnloaded() {
            console.log(`${CALL_TAG} NVUnloaded`);
            Log.i(CALL_TAG, "NVUnloaded")
        },
        unmounted() {
            console.log(`${CALL_TAG} unmounted`);
            Log.i(CALL_TAG, "unmounted")
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