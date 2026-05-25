<template>
    <view class="container">
      <view class="trtc-calling-index">
        <view class="trtc-calling-index-search">
          <view class="search">
            <view class="input-box">
              <input class="input-search-user" :value="userIDToSearch" maxlength="11" type="text" v-on:input="userIDToSearchInput" placeholder="搜索用户ID" />
            </view>
            <view class="btn-search" @click="searchUser">搜索</view>
          </view>
          <view class="search-selfInfo">
            <label class="search-selfInfo-label">您的ID</label>
            <view class="search-selfInfo-phone">
              {{ config.userID }}
            </view>

            <view style="height: 48rpx; width: 48rpx;" v-if="searchList.length !== 0">
              <view class="allcheck" @click="allCheck" v-if="ischeck">
                全选
              </view>
              <view class="allcheck" @click="allCancel" v-else>
                取消
              </view>
            </view>
          </view>

          <scroll-view v-if="callBtn" scroll-y class="trtc-calling-group-user-list">
            <view>
              <view class="trtc-calling-group-user-row" v-for="(item, index) in searchList" :key="index">
                <view class="trtc-calling-group-user-item">
                  <view v-if="!item.checked" class="trtc-calling-group-user-switch" @click="addUser" :data-word="item">
                  </view>
                  <image v-else class="trtc-calling-group-user-checkimg" @click="removeUser" :data-word="item" src="/static/images/check.png">
                  </image>
                  <Avatar :src="item.avatarURL" :defaultAvatarType="'user'"/>
                  <view class="trtc-calling-group-user-name">{{
                    item.userID
                  }}</view>
                </view>
              </view>
            </view>
          </scroll-view>

          <view v-if="callBtn && searchList.length > 0" class="trtc-calling-group-user-callbtn" @click="groupCall">
            开始通话
          </view>

          <view v-if="!callBtn" class="search-default">
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
          searchList: [],
          callBtn: false,
          ischeck: true,
          isCalling: false,
          config: {
            userID: ''
          },
          groupID: '',
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
        if (uni.$groupCallLastSearchList && uni.$groupCallLastSearchList.length > 0) {
          this.searchList = uni.$groupCallLastSearchList
          this.callBtn = true
        }
      },
      onUnload() {
        if (uni.$callSource !== 'caller') {
          uni.$groupCallLastSearchList = null
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

          if (this.userIDToSearch === this.config.userID) {
            uni.showToast({
              icon: 'none',
              title: '无法向自己发起呼叫'
            })
            return
          }

          if (this.searchList.length > 7) {
            return
          }

          for (var i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].userID === this.userIDToSearch) {
              uni.showToast({
                icon: 'none',
                title: 'userId已存在,请勿重复添加。'
              })
              return
            }
          }

          this.contactState.fetchUserInfo([this.userIDToSearch]).then(function(userList) {
            if (userList.length === 0) {
              uni.showToast({
                icon: 'none',
                title: '未查询到此用户'
              })
              return
            }
            var list = {
              userID: self.userIDToSearch,
              nick: userList[0].nick,
              avatar: userList[0].avatarURL,
              avatarURL: userList[0].avatarURL,
              checked: false
            }
            self.searchList.push(list)
            self.callBtn = true
            self.userIDToSearch = ''
          }).catch(function(error) {
            if (error && error.code === 70107) {
              uni.showToast({
                title: '未查询到此用户',
                icon: 'none'
              })
            }
          })
        },
        groupCall() {
          var self = this
          // 防抖：上一次呼叫流程尚未完成时，不允许再次呼叫
          if (this.isCalling) {
            console.log('[groupCall] call skipped: isCalling is true')
            return
          }
          if (isNavigating()) {
            console.log('[groupCall] call skipped: navigation in progress')
            return
          }
          if (isCallEnding()) {
            console.log('[groupCall] call skipped: previous call end still processing')
            return
          }

          var newList = this.searchList.filter(function(item) {
            return item.checked
          })
          var userIDList = newList.map(function(item) {
            return item.userID
          })

          if (userIDList.length === 0) {
            uni.showToast({
              icon: 'none',
              title: '未选择呼叫用户'
            })
            return
          }

          var selfInfoValue = this.callState.state.selfInfo
          if (selfInfoValue && (selfInfoValue.status === 1 || selfInfoValue.status === 2)) {
            plus.nativeUI.toast('您正在通话中，无法再次发起通话', {
              align: 'center',
              verticalAlign: 'center'
            })
            return
          }

          this.isCalling = true

          if (this.config.type === 1) {
            this.deviceState.openLocalCamera({
              isFront: true
            })
          }
          this.deviceState.openLocalMicrophone({
            fail: function(error) {
              if (error === -1104) {
                setTimeout(function() {
                  self.deviceState.openLocalMicrophone()
                }, 200)
              }
            }
          })

          checkCallPermissionWithDialog(this.config.type).then(function(hasPermission) {
            if (!hasPermission) {
              self.isCalling = false
              return
            }

            // 保存搜索列表
            uni.$groupCallLastSearchList = self.searchList.map(function(item) {
              var copy = {}
              var keys = Object.keys(item)
              for (var i = 0; i < keys.length; i++) {
                copy[keys[i]] = item[keys[i]]
              }
              return copy
            })

            if (userIDList.length > 8) {
              uni.showToast({
                icon: 'none',
                title: '当前通话最多支持 9 人同时在线'
              })
              self.isCalling = false
              return
            }

            self.callState.setFramework(14)
            self.callState.calls({
              participantIds: userIDList,
              mediaType: self.config.type,
              success: function() {
                uni.$callSource = 'caller'
                uni.$lastPage = getCurrentPageFullPath()
                if (userIDList.length > 1) {
                  uni.navigateTo({
                    url: '/uni_modules/tuikit-atomic-x/pages/call?layoutTemplate=Grid',
                    complete: function() {
                      self.isCalling = false
                    }
                  })
                } else {
                  uni.navigateTo({
                    url: '/uni_modules/tuikit-atomic-x/pages/call?layoutTemplate=Float',
                    complete: function() {
                      self.isCalling = false
                    }
                  })
                }
              },
              fail: function(error) {
                if (error === CallErrorCode.PACKAGE_NOT_PURCHASED) {
                  uni.showToast({
                    icon: 'none',
                    title: '您的应用还未开通音视频通话（TUICallKit）能力，您可以去控制台申请免费体验'
                  })
                  console.error('控制台申请免费体验,https://console.cloud.tencent.com/trtc')
                }
                self.isCalling = false
              }
            })
            self.ischeck = true
          }).catch(function(error) {
            console.log('groupCall error:', error)
            self.isCalling = false
          })
        },
        addUser(event) {
          var word = event.target.dataset.word || (event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.word)
          if (!word) return
          for (var i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].userID === word.userID) {
              this.$set(this.searchList[i], 'checked', true)
            }
          }
        },
        removeUser(event) {
          var word = event.target.dataset.word || (event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.word)
          if (!word) return
          for (var i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].userID === word.userID) {
              this.$set(this.searchList[i], 'checked', false)
            }
          }
        },
        allCheck() {
          for (var i = 0; i < this.searchList.length; i++) {
            this.$set(this.searchList[i], 'checked', true)
          }
          this.ischeck = false
        },
        allCancel() {
          for (var i = 0; i < this.searchList.length; i++) {
            this.$set(this.searchList[i], 'checked', false)
          }
          this.ischeck = true
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

    .trtc-calling-group-container {
      height: 30%;
      color: #000000;
      padding: 0 16px;
    }

    .trtc-calling-group-title {
      font-weight: bold;
      font-size: 18px;
      display: inline-block;
    }

    .trtc-calling-group-confirm {
      float: right;
      color: #0a6cff;
      font-size: 14px;
    }

    .trtc-calling-group-user-list {
      height: 62%;
    }

    .trtc-calling-group-user-row {
      display: flex;
      align-items: center;
    }

    .trtc-calling-group-user-item {
      display: flex;
      align-items: center;
      flex: 1;
      margin-top: 10px;
    }

    .trtc-calling-group-user-checkimg {
      width: 6.4vw;
      height: 6.4vw;
      margin: 0px 20px;
      border: 2px solid;
    }

    .trtc-calling-group-user-name {
      font-family: PingFangSC-Regular;
      font-weight: 400;
      font-size: 14px;
      color: #666666;
      letter-spacing: 0;
      padding-left: 5px;
    }

    .trtc-calling-group-user-switch {
      width: 6.4vw;
      height: 6.4vw;
      border: 2px solid #c7ced7;
      margin: 0px 20px;
      border-radius: 50%;
    }

    .trtc-calling-group-user-avatar {
      width: 17vw;
      height: 17vw;
      border-radius: 20px;
      margin: 10px 20px 10px 0px;
    }

    .trtc-calling-group-user-callbtn {
      position: absolute;
      bottom: 12%;
      left: 31.5%;
      width: 37vw;
      text-align: center;
      height: 13.5vw;
      background-color: #006eff;
      border-radius: 50px;
      color: white;
      font-size: 18px;
      line-height: 13.5vw;
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
      width: 100%;
      margin: 0;
      padding: 16px 0;
      align-items: center;
    }

    .userInfo-box {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #333333;
      letter-spacing: 0;
      font-weight: 500;
    }

    .userInfo-box>.userInfo-avatar {
      width: 64px;
      height: 64px;
      border-radius: 10px;
    }

    .userInfo-box>.userInfo-name {
      padding-left: 8px;
    }

    .btn-userinfo-call {
      background-color: #0a6cff;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 14px;
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
      align-items: center;
      justify-content: center;
    }

    .search-default-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
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

    /* 全选 */
    .allcheck {
      position: absolute;
      right: 28px;
      font-family: PingFangSC-Regular;
      font-weight: 400;
      font-size: 14px;
      color: #666666;
      letter-spacing: 0;
      line-height: 18px;
    }
  </style>