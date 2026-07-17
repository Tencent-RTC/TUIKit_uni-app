<script lang="ts">

  // Set the CallView page path for CallKit auto-navigation.

  // Fill in the authentication info obtained from Step 3
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
