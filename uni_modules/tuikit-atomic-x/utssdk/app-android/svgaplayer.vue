<template>
    <view class="defaultStyles" style="width: 200px; height: 600px;"> </view>
</template>
<script lang="uts">
    import Log from "android.util.Log"
    import SVGAAnimationView from "uts.sdk.modules.atomicx.kotlin.SVGAAnimationView";
    import SVGACallback from "com.opensource.svgaplayer.SVGACallback"

    const SVGA_TAG = "SvgaPlayer"

    export default {
        name: "svga-player",
        /**
         * 组件涉及的事件声明，只有声明过的事件，才能被正常发送
         */
        emits: ['onFinished'],
        /**
         * 规则：如果没有配置expose，则 methods 中的方法均对外暴露，如果配置了expose，则以expose的配置为准向外暴露
         * ['publicMethod'] 含义为：只有 `publicMethod` 在实例上可用
         */
        expose: ['startPlay', 'stopPlay'],
        methods: {
            startPlay(url : string) {
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
        },
        NVLayouted() {
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
        override onPause() { }

        override onFinished() {
            console.log("SvgaPlayer onFinished")
            this.comp.$emit("onFinished")
        }

        override onRepeat() { }
        override onStep(frame : Int, percentage : Double) { }
    }
</script>

<style>
    /* 定义默认样式值, 组件使用者没有配置时使用 */
    .defaultStyles {
        background-color: white;
    }
</style>