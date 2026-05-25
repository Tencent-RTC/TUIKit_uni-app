<template>
    <view class="btn" @click="toggleFloatWindow">
      <image class="btn-img" :style="iosFixStyle" :src="FLOAT_WINDOW_SRC"></image>
    </view>
  </template>

  <script>
    import {
      useCallState
    } from '@/uni_modules/tuikit-atomic-x/state/CallState';

    var FLOAT_WINDOW_SRC = '/uni_modules/tuikit-atomic-x/static/icon/float-window.png';

    var callStateInstance = useCallState();

    // 头像缓存
    var avatarCache = {};
    // 默认头像直接使用本地静态资源，不依赖网络下载
    var defaultAvatarLocalPath = toAbsolutePath('/static/images/default-call.png');

    /**
     * 将 /static/ 相对路径转为原生层可用的本地绝对路径
     */
    function toAbsolutePath(relativePath) {
      if (typeof plus !== 'undefined' && plus && plus.io && plus.io.convertLocalFileSystemURL) {
        return plus.io.convertLocalFileSystemURL(relativePath);
      }
      return relativePath;
    }

    /**
     * 批量转换对象中所有 value 的路径为绝对路径
     */
    function convertIconPaths(iconMap) {
      var result = {};
      var keys = Object.keys(iconMap);
      for (var i = 0; i < keys.length; i++) {
        result[keys[i]] = toAbsolutePath(iconMap[keys[i]]);
      }
      return result;
    }

    var waitingAnimation = toAbsolutePath('/static/images/callview-loading.gif');

    var volumeLevelIcons = convertIconPaths({
      'Mute': '/static/images/callview-self-mute.png',
      'Low': '/static/images/callview-network.png',
      'Medium': '/static/images/callview-network.png',
      'High': '/static/images/callview-network.png',
      'Peak': '/static/images/callview-network.png'
    });

    var networkQualityIcons = convertIconPaths({
      'BAD': '/static/images/callview-network-bad.png',
      'VERY_BAD': '/static/images/callview-network-bad.png'
    });

    function getDefaultAvatarPath() {
      return defaultAvatarLocalPath;
    }

    function downloadAvatar(url) {
      if (avatarCache[url]) {
        return Promise.resolve(avatarCache[url]);
      }
      return new Promise(function(resolve) {
        uni.downloadFile({
          url: url,
          success: function(res) {
            if (res.statusCode === 200) {
              var absolutePath = '';
              if (typeof plus !== 'undefined' && plus && plus.io && plus.io.convertLocalFileSystemURL) {
                absolutePath = plus.io.convertLocalFileSystemURL(res.tempFilePath);
              } else {
                absolutePath = res.tempFilePath;
              }
              console.log('[FloatWindow] downloadAvatar success, temp:', res.tempFilePath, 'absolute:', absolutePath);
              avatarCache[url] = absolutePath;
              resolve(absolutePath);
            } else {
              console.warn('[FloatWindow] downloadAvatar failed, statusCode:', res.statusCode, url);
              resolve(getDefaultAvatarPath());
            }
          },
          fail: function(err) {
            console.error('[FloatWindow] downloadAvatar error:', url, err);
            resolve(getDefaultAvatarPath());
          }
        });
      });
    }

    export default {
      data: function() {
        var isIOS = uni.getSystemInfoSync().platform === 'ios';
        return {
          FLOAT_WINDOW_SRC: FLOAT_WINDOW_SRC,
          isFloatWindowOpen: false,
          isToggling: false,
          participantAvatars: {},
          iosFixStyle: isIOS ? {
            transform: 'rotate(90deg)'
          } : {}
        };
      },
      computed: {
        allParticipants: function() {
          return callStateInstance.state.allParticipants;
        }
      },
      watch: {
        allParticipants: {
          handler: function(newVal) {
            if (!newVal) {
              return;
            }
            this.updateParticipantAvatars(newVal);
          },
          immediate: true,
          deep: true
        }
      },
      methods: {
        updateParticipantAvatars: function(participants) {
          var self = this;
          if (!participants || participants.length === 0) {
            self.participantAvatars = {};
            return;
          }
          var avatarMap = {};
          var tasks = [];
          for (var i = 0; i < participants.length; i++) {
            var participant = participants[i];
            if (participant.id && participant.avatarURL) {
              (function(pid, purl) {
                tasks.push(
                  downloadAvatar(purl).then(function(localPath) {
                    avatarMap[pid] = localPath;
                  })
                );
              })(participant.id, participant.avatarURL);
            } else if (participant.id) {
              avatarMap[participant.id] = getDefaultAvatarPath();
            }
          }
          Promise.all(tasks).then(function() {
            console.log('[FloatWindow] participantAvatars updated:', avatarMap);
            self.participantAvatars = avatarMap;
          });
        },
        toggleFloatWindow: function() {
          var self = this;
          if (self.isToggling) {
            console.warn('[FloatWindow] toggleFloatWindow throttled, ignoring');
            return;
          }
          self.isToggling = true;
          setTimeout(function() {
            self.isToggling = false;
          }, 500);

          if (self.isFloatWindowOpen) {
            callStateInstance.stopFloatWindow();
            self.isFloatWindowOpen = false;
          } else {
            callStateInstance.startFloatWindow({
              avatars: self.participantAvatars,
              waitingAnimation: waitingAnimation,
              volumeLevelIcons: volumeLevelIcons,
              networkQualityIcons: networkQualityIcons
            }, function(code, message) {
              if (code !== -1) {
                self.isFloatWindowOpen = true;
                uni.navigateBack({
                  delta: 1,
                  fail: function() {
                    uni.redirectTo({
                      url: uni.$lastPage
                    });
                  }
                });
              }
              console.error('show FloatWindow, code: ' + code + ', message: ' + message);
            });
          }
        }
      }
    };
  </script>

  <style scoped>
    .btn {
      width: 48px;
      height: 48px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .btn-img {
      width: 24px;
      height: 24px;
    }
  </style>