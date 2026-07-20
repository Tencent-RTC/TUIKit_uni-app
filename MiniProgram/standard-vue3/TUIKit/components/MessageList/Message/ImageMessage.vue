<template>
    <div class="image-message">
        <image :src="message?.payload.imageInfoArray[0]?.url" :style="imgStyle" @click="previewImage" />
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

const props = defineProps({
    message: {
        type: Object,
    },
})

const imgStyle = ref({});

const previewImage = (e: Event) => {
    const currentUrl = props.message?.payload.imageInfoArray[0]?.url;
    if (!currentUrl) return;
    uni.previewImage({
        current: currentUrl,
        urls: [currentUrl],
        indicator: 'default',
        loop: false,
    });
}

const calculateImageSize = (width: number, height: number) => {
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
}

const setImageStyle = (width: number, height: number) => {
    imgStyle.value = {
        width: `${width}px`,
        height: `${height}px`
    };
}

const getImageSizeFromProps = () => {
    const imageInfo = props.message?.payload.imageInfoArray[0];
    if (imageInfo?.width && imageInfo?.height) {
        return { width: imageInfo.width, height: imageInfo.height };
    }
    return null;
}

const detectImageSize = () => {
    uni.getImageInfo({
        src: props.message?.payload.imageInfoArray[0]?.url,
        success: (res) => {
            const { width, height } = calculateImageSize(res.width, res.height);
            setImageStyle(width, height);
        },
        fail: () => {
            setImageStyle(200, 200);
        }
    });
}

onMounted(() => {
    const sizeFromProps = getImageSizeFromProps();
    if (sizeFromProps) {
        const { width, height } = calculateImageSize(sizeFromProps.width, sizeFromProps.height);
        setImageStyle(width, height);
    } else {
        detectImageSize();
    }
});
</script>

<style lang="scss" scoped>
.image-message {
    image {
        border-radius: 8px;
        object-fit: contain;
    }
}
</style>
