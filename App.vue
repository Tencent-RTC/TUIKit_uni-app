<!-- HBuilder X 版本要求: 3.6.11+ -->
<script lang="ts">
  import { useLiveState } from "@/uni_modules/ui-component/state/livestate";
  import { initConstants } from './components/atomic-x/utils/index';
  
  const LanguageMap = {
    'zh-CN': 'zh-Hans', // android
    'zh-TW': 'zh-Hant', // android
    'zh-Hans-US': 'zh-Hans', // iOS
    en: 'en',
  };
  
  const { callExperimentalAPI } = useLiveState();
  
  let firstBackTime = 0
  export default {
    onLaunch: function () {
      initConstants();
      console.log('App Launch')
			
			uni.$liveId = '';
      
      uni.getSystemInfo()
        .then((systemInfo) => {
            console.log(`systemInfo.language: ${systemInfo.language}`);
            const data = {
              api: 'setCurrentLanguage',
              params: {
                language: LanguageMap[systemInfo.language] || LanguageMap['zh-CN'],
              } ,
            };
            console.log(`callExperimentalAPI data: ${JSON.stringify(data)}`);
            
            callExperimentalAPI({ jsonData: JSON.stringify(data) });
          })
        .catch((e) => {
            console.error('获取系统信息失败', e);
          });
    },
    onShow: function () {
      console.log('App Show')
    },
    onError:function(error: any){
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
  }
</script>

<style>
  /*每个页面公共css */
  /* uni.css - 通用组件、模板样式库，可以当作一套ui库应用 */
  /* #ifdef APP-VUE */
  /* #endif */
</style>