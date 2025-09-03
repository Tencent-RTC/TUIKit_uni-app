<template>
    <view class="defaultStyles" style="width: 200px; height: 600px;"> </view>
</template>
<script lang="uts">
    import Log from "android.util.Log"
    import SVGAAnimationView from "uts.sdk.modules.uiComponent.kotlin.SVGAAnimationView";
    import SVGACallback from "com.opensource.svgaplayer.SVGACallback"

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
                    // console.log(`${SVGA_TAG} ===== newValue, ${newValue}`);
                    // Log.e(SVGA_TAG, "newValue: " + newValue)
                    // this.$el?.playAnimation(newValue)
                },
                immediate: true // 创建时是否通过此方法更新属性，默认值为false
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
                console.log(`${SVGA_TAG} startAnimation, url: ${url}`);
                Log.e(SVGA_TAG, "startAnimation, url: " + url)
                this.$el?.startAnimation(url)
            },
            stopPlay() {
                console.log(`${SVGA_TAG} stop`);
                Log.e(SVGA_TAG, "stopAnimation ")
                this.$el?.stopAnimation()
            }
        },
        created() {
            console.log(`${SVGA_TAG} created`);
            Log.e(SVGA_TAG, "created ")
        },
        NVLoad() : SVGAAnimationView {
            let svgaView = new SVGAAnimationView($androidContext!)
            svgaView.setCallback(new InnerSVGACallback(this))
            console.log(`${SVGA_TAG} NVLoad, ${svgaView}`);
            Log.e(SVGA_TAG, "NVLoad ")
            return svgaView;
        },
        NVLoaded() {
            console.log(`${SVGA_TAG} NVLoaded, ${UTSAndroid.devicePX2px(1080)}`);
            Log.e(SVGA_TAG, "NVLoaded ")
        },
        NVLayouted() {
            console.log(`${SVGA_TAG} NVLayouted`);
            Log.e(SVGA_TAG, "NVLayouted ")
        },
        NVUpdateStyles(styles : Map<String, any>) {
            console.log(`${SVGA_TAG} NVUpdateStyles, ${styles}`);
            Log.e(SVGA_TAG, "NVUpdateStyles ")
        },
        NVBeforeUnload() {
            console.log(`${SVGA_TAG} NVBeforeUnload`);
            Log.e(SVGA_TAG, "NVBeforeUnload ")
        },
        NVUnloaded() {
            console.log(`${SVGA_TAG} NVUnloaded`);
            Log.e(SVGA_TAG, "NVUnloaded ")
        },
        unmounted() {
            console.log(`${SVGA_TAG} unmounted`);
            Log.e(SVGA_TAG, "unmounted ")
        }
    }
    
    class InnerSVGACallback extends SVGACallback {
        private comp : UTSComponent<SVGAAnimationView>;
        
        constructor(comp : UTSComponent<SVGAAnimationView>) {
          super();
          this.comp = comp;
        }
        override onPause(){}
        
        override onFinished() {
            console.log("SvgaPlayer onFinished")
            this.comp.$emit("onFinished")
        }

        override onRepeat(){}
        override onStep(frame: Int, percentage: Double){}
    }
</script>

<style>
    /* 定义默认样式值, 组件使用者没有配置时使用 */
    .defaultStyles {
        background-color: white;
    }
</style>