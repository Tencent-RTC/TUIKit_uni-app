<template>
    <view class="defaultStyles" style="width: 200px; height: 600px;"> </view>
</template>
<script lang="uts">
    import { UIView } from 'UIKit';
    import { SVGAPlayer } from 'SVGAPlayer';

    const SVGA_TAG = "SvgaPlayer"

    export default {
        name: "svga-player",
        props: {
            "url": {
                type: String,
                default: ""
            }
        },
        watch: {
            "url": {
                handler(newValue : String, oldValue : String) {
                    if (this.$el != null) {
                        // this.$el.playAnimation(newValue)
                    }
                },
                immediate: false // 创建时是否通过此方法更新属性，默认值为false
            },
        },
        /**
         * 组件涉及的事件声明，只有声明过的事件，才能被正常发送
         */
        emits: ['onFinished'],
        /**
         * 规则：如果没有配置expose，则 methods 中的方法均对外暴露，如果配置了expose，则以expose的配置为准向外暴露
         * ['publicMethod'] 含义为：只有 `publicMethod` 在实例上可用
         */
        expose: ['startPlay','stopPlay'],
        methods: {
            startPlay(url: string) {
                console.log(`${SVGA_TAG} startPlay, url: ${url}`);
                this.$el.startAnimation(url)
            },
            stopPlay() {
                console.log(`${SVGA_TAG} stopPlay`);
                this.$el.stopAnimation()
            }
        },
        created() {
            console.log(`${SVGA_TAG} created`);
        },
        NVLoad() : SVGAAnimationView {
            let svgaView = new SVGAAnimationView()
            svgaView.setDelegate(new InnerDelegate(this))
            console.log(`${SVGA_TAG} NVLoad, ${svgaView}`);
            return svgaView;
        },
        NVLoaded() {
            console.log(`${SVGA_TAG} NVLoaded}`);
        },
        NVLayouted() {
            console.log(`${SVGA_TAG} NVLayouted`);
        },
        NVUpdateStyles(styles : Map<String, any>) {
            console.log(`${SVGA_TAG} NVUpdateStyles, ${styles}`);
        },
        NVBeforeUnload() {
            console.log(`${SVGA_TAG} NVBeforeUnload`);
        },
        NVUnloaded() {
            console.log(`${SVGA_TAG} NVUnloaded`);
        },
        unmounted() {
            console.log(`${SVGA_TAG} unmounted`);
        }
    }

    class InnerDelegate implements SVGAAnimationViewDelegate {
        private component : UTSComponent<SVGAAnimationView>
        
        constructor(component : UTSComponent<SVGAAnimationView>) {
          this.component = component
          super.init()
        }
        
        onFinished() {  
            this.component.$emit("onFinished")
        } 
    }
</script>

<style>
    /* 定义默认样式值, 组件使用者没有配置时使用 */
    .defaultStyles {
        background-color: white;
    }
</style>