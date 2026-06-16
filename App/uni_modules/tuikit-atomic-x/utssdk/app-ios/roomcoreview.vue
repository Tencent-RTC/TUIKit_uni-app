<template>
    <view class="defaultStyles"> </view>
</template>
<script lang="uts">
    import { UIView } from 'UIKit';

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
                type: UTSJSONObject,
                default: () : UTSJSONObject => {
                    return {}
                }
            }
        },
        watch: {
            "roomID": {
                handler(newValue : String, oldValue : String) {
                    this.$el.setRoomID(newValue as Any)
                },
                immediate: true
            },
            "roomType": {
                handler(newValue : Number, oldValue : Number) {
                    this.$el.setRoomType(newValue as Any)
                },
                immediate: true
            },
            "icons": {
                handler(newValue : UTSJSONObject, oldValue : UTSJSONObject) {
                    this.$el.setIcons(JSON.stringify(newValue) as Any)
                },
                immediate: true,
                deep: true
            }
        },
        NVLoad() : RoomRenderView {
            return new RoomRenderView();
        },
        NVLoaded() {
            this.$el.setRoomType(this.roomType as Any)
            this.$el.setIcons(JSON.stringify(this.icons) as Any)
            if (this.roomID.length > 0) {
                this.$el.setRoomID(this.roomID as Any)
            }
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
