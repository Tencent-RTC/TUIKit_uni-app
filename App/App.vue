<script lang="ts">
  import { loginFromStorage } from './server/loginService';
  import { pushService } from './server/pushService';

  let firstBackTime = 0

  export default {
    onLaunch: function () {
      console.log('App Launch')
      pushService.init();
      loginFromStorage();
      uni?.removeStorage({
        key: 'showSecurity',
      });
    },
    onShow: function () {
      console.log('App Show')
    },
    onError: function (error : any) {
      console.log('App onError: ', error)
    },
    onHide: function () {
      console.log('App Hide')
    },
    // #ifdef UNI-APP-X && APP-ANDROID
    onLastPageBackPress: function () {
      console.log('App LastPageBackPress')
      if (firstBackTime == 0) {
        uni.showToast({
          title: '再按一次退出应用',
          position: 'bottom',
        })
        firstBackTime = Date.now()
        setTimeout(() => {
          firstBackTime = 0
        }, 2000)
      } else if (Date.now() - firstBackTime < 2000) {
        firstBackTime = Date.now()
        uni.exit()
      }
    },
    // #endif
    onExit() {
      console.log('App Exit')
    },
  };
</script>

<style>
  uni-page-body,
  html,
  body,
  page {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
  }
</style>