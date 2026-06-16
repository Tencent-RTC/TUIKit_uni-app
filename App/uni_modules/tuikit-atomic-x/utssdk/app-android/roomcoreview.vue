<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import RoomRenderView from 'uts.sdk.modules.atomicx.kotlin.RoomRenderView';

    export default {
        name: "room-core-view",
        props: {
            "roomID": {
                type: String,
                default: ""
            },
            "roomType": {
                type: Number,
                default: 1
            },
            "icons": {
                type: Object,
                default: () => ({})
            }
        },
        watch: {
            "roomID": {
                handler(newValue : String, oldValue : String) {
                    this.$el?.setRoomID(newValue)
                },
                immediate: true
            },
            "roomType": {
                handler(newValue : Number, oldValue : Number) {
                    this.$el?.setRoomType(newValue)
                },
                immediate: true
            },
            "icons": {
                handler(newValue: Any, oldValue: Any) {
                    this.$el?.setIcons(newValue)
                },
                immediate: true,
                deep: true
            }
        },
        NVLoad() : RoomRenderView {
            let roomView = new RoomRenderView($androidContext!)
            roomView.setRoomType(this.roomType)
            roomView.setIcons(this.icons)
            roomView.setRoomID(this.roomID)
            return roomView;
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
