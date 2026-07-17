<template>
    <image :style="avatarStyle" :src="avatarSrc" @error="handleImageError"/>
</template>


<script lang="ts" setup>
import { ref, watch } from 'vue';
import defaultAvatarIcon from '../../assets/base/default-avatar.png'
const avatarSrc = ref('');

const props = defineProps({
    src: {
        type: String,
        default: defaultAvatarIcon
    },
    avatarStyle: {
        type: [String, Object],
        default: () => ({})
    }
})

watch(() => props.src, () => {
    avatarSrc.value = props.src;
}, {
    immediate: true,
});

function handleImageError() {
    avatarSrc.value = defaultAvatarIcon;
}
</script>

<style></style>