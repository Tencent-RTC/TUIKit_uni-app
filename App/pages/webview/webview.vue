<template>
  <div class="page">
    <web-view
      class="web-view"
      :fullscreen="true"
      :src="url"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const url = ref('');
const title = ref('');

onLoad((options) => {
  url.value = options.url;
  title.value = options.title;
});
</script>
