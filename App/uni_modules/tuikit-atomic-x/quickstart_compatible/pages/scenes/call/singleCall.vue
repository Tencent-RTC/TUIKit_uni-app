<template>
    <view class="container">
      <view class="trtc-calling-index">
        <view class="trtc-calling-index-search">
          <view class="search">
            <view class="input-box">
              <input class="input-search-user" :value="userIDToSearch" maxlength="50" type="text" v-on:input="userIDToSearchInput" placeholder="搜索用户ID" />
            </view>
            <view class="btn-search" @click="searchUser">搜索</view>
          </view>
          <view class="search-selfInfo">
            <label class="search-selfInfo-label">您的ID</label>
            <view class="search-selfInfo-phone">
              {{ config.userID }}
            </view>
          </view>
          <view class="search-result">
            <view v-if="invitee.userID" class="user-to-call">
              <view class="userInfo-box">
                <Avatar :src="invitee.avatarURL" :defaultAvatarType="'user'"/>
                <text class="userInfo-name">{{ invitee.userID }}</text>
              </view>
              <view class="btn-userinfo-call" @click="call">呼叫</view>
            </view>
            <view v-else>未查询到此用户</view>
          </view>
          <view v-if="!invitee.userID" class="search-default">
            <view class="search-default-box">
              <image class="search-default-img" src="/static/images/search.png" lazy-load="true" />
              <view class="search-default-message">
                搜索添加已注册用户以已发起通话
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </template>

  <script>
    import Avatar from '@/uni_modules/tuikit-atomic-x/components/Avatar'
    import {
      getCurrentPageFullPath,
      isNavigating,
      isCallEnding
    } from '@/uni_modules/tuikit-atomic-x/server/callService'
    import {
      useContactState
    } from '@/uni_modules/tuikit-atomic-x/state/ContactState'
    import {
      useCallState,
      CallErrorCode
    } from '@/uni_modules/tuikit-atomic-x/state/CallState'
    import {
      useDeviceState
    } from '@/uni_modules/tuikit-atomic-x/state/DeviceState'
    import {
      checkCallPermissionWithDialog
    } from '@/uni_modules/tuikit-atomic-x/utils/callPermission'
    import {
      useLoginState
    } from '@/uni_modules/tuikit-atomic-x/state/LoginState'

    export default {
      components: {
        Avatar
      },
      data() {
        var contactState = useContactState()
        var callState = useCallState()
        var deviceState = useDeviceState()
        var loginState = useLoginState()
        return {
          userIDToSearch: '',
          searchResultShow: false,
          isCalling: false,
          invitee: {
            userID: ''
          },
          config: {
            userID: '',
            type: 1
          },
          contactState: contactState,
          callState: callState,
          deviceState: deviceState,
          loginState: loginState
        }
      },
      onLoad(option) {
        var loginUserInfo = this.loginState.state.loginUserInfo
        var userId = (loginUserInfo && loginUserInfo.userID) || ''
        uni.$userID = userId
        this.config = {
          userID: userId,
          type: Number(option.type)
        }
        if (uni.$singleCallLastInvitee) {
          this.invitee = uni.$singleCallLastInvitee
        }
      },
      onUnload() {
        if (uni.$callSource !== 'caller') {
          uni.$singleCallLastInvitee = null
        }
        this.contactState.destroyStore()
      },
      methods: {
        userIDToSearchInput(e) {
          this.userIDToSearch = e.detail.value
        },
        searchUser() {
          var self = this
          var newSearch = this.userIDToSearch.trim()
          this.userIDToSearch = newSearch
          this.contactState.fetchUserInfo([this.userIDToSearch]).then(function(userList) {
            if (userList.length === 0) {
              uni.showToast({
                icon: 'none',
                title: '未查询到此用户'
              })
              return
            }
            if (userList[0].userID === self.config.userID) {
              uni.showToast({
                icon: 'none',
                title: '无法向自己发起呼叫'
              })
              return
            }
            var user = {}
            var keys = Object.keys(userList[0])
            for (var i = 0; i < keys.length; i++) {
              user[keys[i]] = userList[0][keys[i]]
            }
            self.invitee = user
            self.searchResultShow = true
          }).catch(function(error) {
            if (error && error.code === 70107) {
              uni.showToast({
                icon: 'none',
                title: '未查询到此用户'
              })
            }
          })
        },
        call() {
          var self = this
          // 防抖：上一次呼叫流程尚未完成时，不允许再次呼叫
          if (this.isCalling) {
            console.log('[singleCall] call skipped: isCalling is true')
            return
          }
          // 导航锁：页面正在切换中，不允许发起呼叫
          if (isNavigating()) {
            console.log('[singleCall] call skipped: navigation in progress')
            return
          }
          // 通话结束流程尚未完成，不允许发起下一次呼叫
          if (isCallEnding()) {
            console.log('[singleCall] call skipped: previous call end still processing')
            return
          }

          var selfInfoValue = this.callState.state.selfInfo
          if (selfInfoValue) {
            if (selfInfoValue.status === 1 || selfInfoValue.status === 2) {
              plus.nativeUI.toast('您正在通话中，无法再次发起通话', {
                align: 'center',
                verticalAlign: 'center'
              })
              return
            }
          }

          this.isCalling = true

          checkCallPermissionWithDialog(this.config.type).then(function(hasPermission) {
            if (!hasPermission) {
              self.isCalling = false
              return
            }

            if (self.config.type === 1) {
              self.deviceState.openLocalCamera({
                isFront: true
              })
            }
            self.deviceState.openLocalMicrophone({
              fail: function(error) {
                if (error === -1104) {
                  setTimeout(function() {
                    self.deviceState.openLocalMicrophone()
                  }, 200)
                }
              }
            })

            uni.$singleCallLastInvitee = {}
            var invKeys = Object.keys(self.invitee)
            for (var i = 0; i < invKeys.length; i++) {
              uni.$singleCallLastInvitee[invKeys[i]] = self.invitee[invKeys[i]]
            }

            // 在调用 calls 之前先记录来源页路径
            var callerPagePath = getCurrentPageFullPath()
            self.callState.setFramework(14)

            self.callState.calls({
              participantIds: [self.invitee.userID],
              mediaType: self.config.type,
              success: function() {
                uni.$callSource = 'caller'
                uni.$lastPage = callerPagePath
                console.log('[singleCall] calls success, uni.$lastPage set to:', uni.$lastPage)
                uni.navigateTo({
                  url: '/uni_modules/tuikit-atomic-x/pages/call?layoutTemplate=Float',
                  complete: function() {
                    self.isCalling = false
                  }
                })
              },
              fail: function(error) {
                if (error === CallErrorCode.PACKAGE_NOT_PURCHASED) {
                  uni.showToast({
                    icon: 'none',
                    title: '您的应用还未开通音视频通话（TUICallKit）能力，您可以去控制台申请免费体验'
                  })
                  console.error('控制台申请免费体验,https://console.cloud.tencent.com/trtc')
                }
                console.log('calls fail:', error)
                self.isCalling = false
              }
            })
          }).catch(function(error) {
            console.log('calls error:', error)
            self.isCalling = false
          })
        }
      }
    }
  </script>

  <style>
    .container {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      margin: 0;
    }

    .trtc-calling-index {
      width: 100vw;
      height: 100vh;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .trtc-calling-index-title {
      position: relative;
      display: flex;
      width: 100%;
      margin-top: 3.8vh;
      justify-content: center;
    }

    .trtc-calling-index-title .title {
      margin: 0;
      font-family: PingFangSC-Regular;
      font-size: 16px;
      color: #000000;
      letter-spacing: 0;
      line-height: 36px;
      padding: 1.2vh;
    }

    .btn-goback {
      position: absolute;
      left: 2vw;
      top: 1.2vh;
      width: 8vw;
      height: 8vw;
      z-index: 9;
    }

    .trtc-calling-index-search {
      flex: 1;
      margin: 0;
      display: flex;
      flex-direction: column;
    }

    .trtc-calling-index-search>.search {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      padding: 16px;
    }

    .btn-search {
      text-align: center;
      width: 60px;
      height: 40px;
      line-height: 40px;
      background: #0a6cff;
      border-radius: 20px;
    }

    .search-result {
      width: 90%;
      height: 40px;
      margin-left: 5%;
    }

    .input-box {
      flex: 1;
      box-sizing: border-box;
      margin-right: 20px;
      height: 40px;
      background: #f4f5f9;
      color: #666666;
      border-radius: 20px;
      padding: 9px 16px;
      display: flex;
      align-items: center;
    }

    .icon-right {
      width: 8px;
      height: 12px;
      margin: 0 4px;
    }

    .input-search-user {
      flex: 1;
      box-sizing: border-box;
    }

    .input-label {
      display: flex;
      align-items: center;
    }

    .input-label-plus {
      padding-bottom: 3px;
    }

    .input-search-user[placeholder] {
      font-family: PingFangSC-Regular;
      font-size: 16px;
      color: #8a898e;
      letter-spacing: 0;
      font-weight: 400;
    }

    .user-to-call {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 50px;
      margin: 0;
      padding: 16px 0;
    }

    .userInfo-box {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #333333;
      letter-spacing: 0;
      font-weight: 500;
    }

    .userInfo-box>.userInfo-name {
      padding-left: 8px;
    }

    .btn-userinfo-call {
      width: 60px;
      height: 40px;
      text-align: center;
      background: #0a6cff;
      border-radius: 20px;
      line-height: 40px;
      margin: 10px 0;
      color: rgba(255, 255, 255);
    }

    .user-to-call>image {
      height: 50px;
      line-height: 50px;
      border-radius: 50px;
    }

    .search-selfInfo {
      position: relative;
      display: flex;
      align-items: center;
      padding: 0 28px;
      font-family: PingFangSC-Regular;
      font-size: 14px;
      color: #333333;
      letter-spacing: 0;
      font-weight: 400;
    }

    .search-selfInfo::before {
      position: absolute;
      content: "";
      width: 4px;
      height: 12px;
      background: #9a9a9a;
      border: 1px solid #979797;
      border-radius: 2px;
      margin: auto 0;
      left: 16px;
      top: 0;
      bottom: 0;
    }

    .search-selfInfo-phone {
      padding-left: 8px;
    }

    .incoming-call {
      width: 100vw;
      height: 100vh;
    }

    .btn-operate {
      display: flex;
      justify-content: space-between;
      position: absolute;
      bottom: 5vh;
      width: 100%;
    }

    .call-operate {
      width: 15vw;
      height: 15vw;
      border-radius: 15vw;
      padding: 5px;
      margin: 0 15vw;
    }

    .tips {
      width: 100%;
      height: 40px;
      line-height: 40px;
      text-align: center;
      font-size: 20px;
      color: #333333;
      letter-spacing: 0;
      font-weight: 500;
    }

    .tips-subtitle {
      height: 20px;
      font-family: PingFangSC-Regular;
      font-size: 14px;
      color: #97989c;
      letter-spacing: 0;
      font-weight: 400;
      text-align: center;
    }

    .search-default {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .search-default-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-bottom: 50vh;
    }

    .search-default-img {
      width: 64px;
      height: 66px;
    }

    .search-default-message {
      width: 126px;
      padding: 16px;
      font-family: PingFangSC-Regular;
      font-size: 14px;
      color: #8a898e;
      letter-spacing: 0;
      text-align: center;
      font-weight: 400;
    }
  </style>