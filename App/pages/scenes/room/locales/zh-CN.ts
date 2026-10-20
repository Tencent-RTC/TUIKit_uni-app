export const zhCN: Record<string, string> = {
  // ===== 通用 =====
  'common.cancel': '取消',
  'common.confirm': '确认',
  'common.ok': '确定',
  'common.copy': '复制',
  'common.save': '保存',
  'common.edit': '编辑',
  'common.end': '结束',
  'common.add': '添加',
  'common.tip': '提示',
  'common.loadingMore': '加载中...',
  'common.peopleCount': '{count}人',

  // ===== 房间入口 =====
  'room.entry.join': '加入房间',
  'room.entry.create': '新建房间',
  'room.entry.schedule': '预定房间',

  // ===== 加入房间 =====
  'join.title': '加入房间',
  'join.roomId': '房间号',
  'join.roomIdPlaceholder': '请输入房间号',
  'join.yourName': '您的姓名',
  'join.enableMic': '开启麦克风',
  'join.enableSpeaker': '开启扬声器',
  'join.enableCamera': '开启摄像头',
  'join.submit': '加入房间',

  // ===== 创建房间 =====
  'quickstart.title': '创建房间',
  'quickstart.submit': '创建房间',
  'quickstart.defaultRoomName': '{name}的房间',

  // ===== 来电邀请 =====
  'invitation.joinNow': '立即加入',
  'invitation.reject': '暂不进入',
  'invitation.callerInvite': '{name}邀请你加入会议',
  'invitation.defaultInvite': '邀请你加入会议',
  'invitation.meetingNo': '会议 {roomId}',
  'invitation.title': '会议邀请',
  'invitation.host': '主持人：{name}',
  'invitation.participants': '参会人：{count}人',

  // ===== 会议主页 =====
  'meeting.recordStartTitle': '是否开启云端录制？',
  'meeting.recordStartMessage': '开启后，将录制房间中的音视频画面、共享屏幕内容到云端，并告知所有参会成员',
  'meeting.recordStartConfirm': '开启录制',
  'meeting.recordStopTitle': '结束云端录制？',
  'meeting.recordStopMessage': '结束录制后，将停止录制房间中的音视频画面、共享屏幕内容到云端，并告知所有参会成员',
  'meeting.recordStopConfirm': '结束录制',

  // ===== 设备按钮 =====
  'device.mute': '静音',
  'device.unmute': '解除静音',
  'device.closeVideo': '关闭视频',
  'device.openVideo': '打开视频',

  // ===== 屏幕共享 =====
  'screenShare.share': '屏幕分享',
  'screenShare.stopShare': '停止分享',
  'screenShare.securityTitle': '安全提醒',
  'screenShare.securityMessage': '共享屏幕时可能会泄漏短信验证码、密码等隐私信息，造成财产损失，请警惕各种诈骗行为。',
  'screenShare.continueShare': '继续共享',
  'screenShare.stopTitle': '结束共享',
  'screenShare.stopConfirm': '结束共享',
  'screenShare.stopMessage': '结束共享后，其他人将无法继续观看你的屏幕内容，确认要结束共享吗？',
  'screenShare.sharingText': '你正在共享屏幕…',
  'screenShare.stopBtn': '停止共享',
  'screenShare.iosNotConfiguredTitle': '未配置屏幕分享扩展',
  'screenShare.iosGuide':
    'iOS 需要配置屏幕分享扩展才能使用该功能：\n' +
    '一、在 nativeResources/ios 下放置三个文件：\n' +
    '1. ios-screenShareUpload.mobileprovision，在 Apple 开发者后台为 Extension 的 Bundle ID 单独创建（需勾选 App Groups 能力）后下载\n' +
    '2. ios-extension.json 配置：\n' +
    '{\n' +
    '  "ScreenShareExtension.appex": {\n' +
    '    "identifier": "com.xxx.upload",\n' +
    '    "profile": "ios-screenShareUpload.mobileprovision",\n' +
    '    "entitlements": {\n' +
    '      "com.apple.security.application-groups": ["group.com.xxx"]\n' +
    '    }\n' +
    '  }\n' +
    '}\n' +
    '各字段来源：\n' +
    '· identifier：Extension 的 Bundle ID，必须是主 App Bundle ID 加后缀（如主 App 为 com.xxx，则填 com.xxx.upload），且与上面 mobileprovision 绑定的 Bundle ID 一致\n' +
    '· profile：上面那份 mobileprovision 的文件名（相对 nativeResources/ios）\n' +
    '· entitlements.com.apple.security.application-groups：Apple 开发者后台创建的 App Group ID（形如 group.com.xxx），主 App 与 Extension 必须同时勾选同一个\n' +
    '3. UniApp.entitlements 配置（主 App 侧的 App Groups 授权，上面 ios-extension.json 里的 entitlements 只对 Extension 生效，主 App 需要这份文件才能与 Extension 共享数据）：\n' +
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<plist version="1.0">\n' +
    '  <dict>\n' +
    '    <key>com.apple.security.application-groups</key>\n' +
    '    <array>\n' +
    '      <string>group.com.xxx</string>\n' +
    '    </array>\n' +
    '  </dict>\n' +
    '</plist>\n' +
    '\n' +
    '二、在项目根目录新建 Info.plist，加入 TUIRoomAppGroup：\n' +
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<plist version="1.0">\n' +
    '  <dict>\n' +
    '    <key>TUIRoomAppGroup</key>\n' +
    '    <string>group.com.xxx</string>\n' +
    '  </dict>\n' +
    '</plist>\n' +
    '以上三处 group.com.xxx（ios-extension.json 的 application-groups、UniApp.entitlements、Info.plist 的 TUIRoomAppGroup）必须完全一致，不一致会推流失败。\n' +
    '\n' +
    '三、重新制作自定义基座后生效。\n' +
    '\n' +
    '具体配置过程请查看官网「快速集成 > 高级功能」。',

  // ===== 成员列表 =====
  'participants.members': '成员',
  'participants.membersWithCount': '成员({count})',
  'participants.invite': '邀请',
  'participants.addMember': '添加成员',
  'participants.inviteJoin': '邀请加入',
  'participants.searchPlaceholder': '搜索参会成员',
  'participants.emptyPending': '暂无未进房成员',
  'participants.callAll': '呼叫所有人',
  'participants.guestWithCount': '嘉宾({count})',
  'participants.enteredWithCount': '已进房({count})',
  'participants.audienceWithCount': '观众({count})',
  'participants.pendingWithCount': '未进房({count})',
  'participants.muteAll': '全体静音',
  'participants.unmuteAll': '解除全体静音',
  'participants.banAllVideo': '全体禁画',
  'participants.unbanAllVideo': '解除全体禁画',
  'participants.muteAllTitle': '所有及新加入的成员将被静音',
  'participants.unmuteAllTitle': '所有成员将被解除静音',
  'participants.muteAllContent': '成员将无法开启麦克风',
  'participants.unmuteAllContent': '解除后用户可以自由开启麦克风',
  'participants.banVideoTitle': '所有及新加入的成员将被禁止视频',
  'participants.unbanVideoTitle': '所有成员将被解除禁止开启视频',
  'participants.banVideoContent': '成员将无法开启视频画面',
  'participants.unbanVideoContent': '解除后用户可以自由开启视频',
  'participants.confirmRelease': '确认解除',
  'participants.inviteSent': '邀请信息已发出，等待成员加入',

  // ===== 成员条目 =====
  'participant.meTag': '（我）',
  'participant.calling': '呼叫中',
  'participant.rejected': '暂不入会',
  'participant.call': '呼叫',
  'participant.owner': '房主',
  'participant.admin': '管理员',

  // ===== 成员操作 =====
  'participantAction.transferOwner': '转交房主',
  'participantAction.kickOut': '踢出房间',
  'participantAction.transferTitle': '将房主转交给{name}',
  'participantAction.transferMessage': '转交房主后将成为普通成员',
  'participantAction.kickMessage': '是否将{name}移除房间？',
  'participantAction.setAudience': '设为观众',
  'participantAction.setGuest': '设为嘉宾',
  'participantAction.requestOpenAudio': '请求开启音频',
  'participantAction.requestOpenVideo': '请求开启视频',
  'participantAction.revokeAdmin': '撤销管理员',
  'participantAction.setAdmin': '设为管理员',
  'participantAction.transferred': '已将房主转移给 {name}',
  'participantAction.adminRevoked': '已撤销 {name} 的管理员',
  'participantAction.adminSet': '已设置 {name} 为管理员',

  // ===== 退出房间 =====
  'exit.leaveRoom': '离开房间',
  'exit.endRoom': '结束房间',
  'exit.ownerTip': '如果您不想结束房间，请在离开房间前指定新的主持人',
  'exit.memberTip': '您确定要离开房间吗',

  // ===== 入会密码 =====
  'password.title': '入会密码',
  'password.placeholder': '请输入入会密码',
  'password.join': '加入房间',

  // ===== 工具面板 =====
  'tool.expand': '展开',
  'tool.collapse': '收起',

  // ===== 房间信息 =====
  'roomInfo.owner': '房主',
  'roomInfo.roomId': '房间号',
  'roomInfo.copyAll': '复制房间信息',
  'roomInfo.roomIdCopied': '房间号已复制',
  'roomInfo.allInfo': '房间名: {roomName}\n房间号: {roomId}',
  'roomInfo.infoCopied': '房间信息复制成功',

  // ===== 邀请面板（会中 / 预约共用）=====
  'inviteSheet.defaultTitle': '邀请成员',
  'inviteSheet.roomName': '房间名称',
  'inviteSheet.roomTime': '房间时间',
  'inviteSheet.roomId': '房间号',
  'inviteSheet.roomPassword': '房间密码',
  'inviteSheet.copyAll': '复制房间信息',
  'inviteSheet.meetingNo': '会议 {roomId}',
  'inviteSheet.meetingInvite': '会议邀请',
  'inviteSheet.lineRoomName': '房间名称：{value}',
  'inviteSheet.lineRoomTime': '房间时间：{value}',
  'inviteSheet.lineRoomId': '房间号：{value}',
  'inviteSheet.lineRoomPassword': '房间密码：{value}',
  'inviteSheet.roomIdCopied': '房间号已复制',
  'inviteSheet.passwordCopied': '密码已复制',
  'inviteSheet.infoCopied': '房间信息已复制',

  // ===== 录制 =====
  'recording.record': '录制',
  'recording.recording': '录制中',

  // ===== 聊天 =====
  'chat.title': '聊天',
  'chat.newMessage': '新消息',
  'chat.newMessageBracket': '[新消息]',
  'chat.textMessage': '[文本消息]',
  'chat.image': '[图片]',
  'chat.video': '[视频]',
  'chat.audio': '[语音]',
  'chat.file': '[文件]',

  // ===== 预定房间 =====
  'schedule.roomName': '房间名称',
  'schedule.roomNamePlaceholder': '请输入房间名称',
  'schedule.startTime': '开始时间',
  'schedule.duration': '房间时长',
  'schedule.timezone': '时区',
  'schedule.attendees': '参与成员',
  'schedule.encrypt': '房间加密',
  'schedule.password': '进房密码',
  'schedule.passwordPlaceholder': '请输入 6 位数字密码',
  'schedule.muteAll': '全体静音',
  'schedule.banAllVideo': '全体禁画',
  'schedule.successInviteTitle': '预定成功，邀请他们加入',
  'schedule.editTitle': '修改房间',
  'schedule.createTitle': '预定房间',
  'schedule.submitCreate': '预定房间',
  'schedule.tempRoomSuffix': '的临时房间',
  'schedule.saveSuccess': '保存成功',

  // ===== 预定列表 =====
  'scheduleList.enter': '进入',
  'scheduleList.empty': '暂无预定的房间',
  'scheduleList.running': '进行中',
  'scheduleList.notStarted': '未开始',

  // ===== 预定详情 =====
  'scheduleDetail.title': '房间详情',
  'scheduleDetail.roomPassword': '房间密码',
  'scheduleDetail.organizer': '发起人',
  'scheduleDetail.enterRoom': '进入房间',
  'scheduleDetail.inviteMember': '邀请成员',
  'scheduleDetail.cancelRoom': '取消房间',
  'scheduleDetail.attendeesTitle': '参与成员（{count}）',
  'scheduleDetail.cancelMessage': '取消后，其他成员将无法加入该房间，确定要取消吗？',
  'scheduleDetail.cancelLater': '暂不取消',
  'scheduleDetail.destroyedTitle': '房间已被销毁',
  'scheduleDetail.destroyedMessage': '该房间已被销毁，点击确定返回上一页。',
  'scheduleDetail.passwordCopied': '密码已复制',
};
