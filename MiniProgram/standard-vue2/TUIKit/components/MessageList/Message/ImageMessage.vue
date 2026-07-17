<template>
    <div class="image-message">
        <image :src="imageUrl" :style="[imgStyle]" @click="previewImage" />
    </div>
</template>

<script lang="ts">
// @ts-nocheck
export default {
    props: {
        message: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            imgStyle: {}
        }
    },
    computed: {
        imageUrl() {
            return this.message && this.message.payload && this.message.payload.imageInfoArray && this.message.payload.imageInfoArray[0] 
                ? this.message.payload.imageInfoArray[0].url 
                : '';
        }
    },
    mounted() {
        const sizeFromProps = this.getImageSizeFromProps();
        if (sizeFromProps) {
            const { width, height } = this.calculateImageSize(sizeFromProps.width, sizeFromProps.height);
            this.setImageStyle(width, height);
        } else {
            this.detectImageSize();
        }
    },
    methods: {
        previewImage(e) {
            if (!this.imageUrl) return;
            uni.previewImage({
                current: this.imageUrl,
                urls: [this.imageUrl],
                indicator: 'default',
                loop: false,
            });
        },
        calculateImageSize(width, height) {
            const maxWidth = 200;
            const maxHeight = 200;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            return { width, height };
        },
        setImageStyle(width, height) {
            this.imgStyle = {
                width: `${width}px`,
                height: `${height}px`
            };
        },
        getImageSizeFromProps() {
            const imageInfo = this.message && this.message.payload && this.message.payload.imageInfoArray 
                ? this.message.payload.imageInfoArray[0] 
                : null;
                
            if (imageInfo && imageInfo.width && imageInfo.height) {
                return { width: imageInfo.width, height: imageInfo.height };
            }
            return null;
        },
        detectImageSize() {
            if (!this.imageUrl) {
                this.setImageStyle(200, 200);
                return;
            }
            
            uni.getImageInfo({
                src: this.imageUrl,
                success: (res) => {
                    const { width, height } = this.calculateImageSize(res.width, res.height);
                    this.setImageStyle(width, height);
                },
                fail: () => {
                    this.setImageStyle(200, 200);
                }
            });
        }
    }
}
</script>

<style lang="scss" scoped>
.image-message {
    image {
        border-radius: 8px;
        object-fit: contain;
    }
}
</style>