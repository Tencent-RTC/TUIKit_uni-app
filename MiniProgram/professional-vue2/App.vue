<script lang="ts">
  export default {
    onLaunch: function () {
      console.log('App Launch');
    },
    onShow: function () {
      console.log('App Show');
    },
    onHide: function () {
      console.log('App Hide');
    }
  };
</script>
<style>
  /* common css for page */
  uni-page-body,
  html,
  body,
  page {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
  }
</style>