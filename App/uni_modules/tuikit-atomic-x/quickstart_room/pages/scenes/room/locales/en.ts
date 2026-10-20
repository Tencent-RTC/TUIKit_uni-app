export const en: Record<string, string> = {
  // ===== Common =====
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.ok': 'OK',
  'common.copy': 'Copy',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.end': 'End',
  'common.add': 'Add',
  'common.tip': 'Notice',
  'common.loadingMore': 'Loading...',
  'common.peopleCount': '{count}',

  // ===== Room entry =====
  'room.entry.join': 'Join Room',
  'room.entry.create': 'New Room',
  'room.entry.schedule': 'Schedule Room',

  // ===== Join room =====
  'join.title': 'Join Room',
  'join.roomId': 'Room ID',
  'join.roomIdPlaceholder': 'Enter room ID',
  'join.yourName': 'Your Name',
  'join.enableMic': 'Enable Microphone',
  'join.enableSpeaker': 'Enable Speaker',
  'join.enableCamera': 'Enable Camera',
  'join.submit': 'Join Room',

  // ===== Create room =====
  'quickstart.title': 'Create Room',
  'quickstart.submit': 'Create Room',
  'quickstart.defaultRoomName': "{name}'s Room",

  // ===== Incoming invitation =====
  'invitation.joinNow': 'Join Now',
  'invitation.reject': 'Not Now',
  'invitation.callerInvite': '{name} invites you to the meeting',
  'invitation.defaultInvite': 'You are invited to the meeting',
  'invitation.meetingNo': 'Meeting {roomId}',
  'invitation.title': 'Meeting Invitation',
  'invitation.host': 'Host: {name}',
  'invitation.participants': 'Participants: {count}',

  // ===== Meeting =====
  'meeting.recordStartTitle': 'Start cloud recording?',
  'meeting.recordStartMessage':
    'Once started, the audio, video and screen sharing content in this room will be recorded to the cloud, and all participants will be notified.',
  'meeting.recordStartConfirm': 'Start Recording',
  'meeting.recordStopTitle': 'Stop cloud recording?',
  'meeting.recordStopMessage':
    'Once stopped, the audio, video and screen sharing content in this room will no longer be recorded to the cloud, and all participants will be notified.',
  'meeting.recordStopConfirm': 'Stop Recording',

  // ===== Device buttons =====
  'device.mute': 'Mute',
  'device.unmute': 'Unmute',
  'device.closeVideo': 'Stop Video',
  'device.openVideo': 'Start Video',

  // ===== Screen sharing =====
  'screenShare.share': 'Share Screen',
  'screenShare.stopShare': 'Stop Sharing',
  'screenShare.securityTitle': 'Security Notice',
  'screenShare.securityMessage':
    'Screen sharing may expose private information such as SMS verification codes and passwords, which could lead to financial loss. Please stay alert to fraud.',
  'screenShare.continueShare': 'Continue Sharing',
  'screenShare.stopTitle': 'Stop Sharing',
  'screenShare.stopConfirm': 'Stop Sharing',
  'screenShare.stopMessage':
    'Once stopped, others will no longer see your screen. Stop sharing now?',
  'screenShare.sharingText': 'You are sharing your screen…',
  'screenShare.stopBtn': 'Stop Sharing',
  'screenShare.iosNotConfiguredTitle': 'Screen Sharing Extension Not Configured',
  'screenShare.iosGuide':
    'On iOS, a screen sharing extension must be configured to use this feature:\n' +
    '1. Place three files under nativeResources/ios:\n' +
    '1) ios-screenShareUpload.mobileprovision — create it separately in the Apple Developer portal for the Extension Bundle ID (App Groups capability must be enabled), then download it\n' +
    '2) ios-extension.json:\n' +
    '{\n' +
    '  "ScreenShareExtension.appex": {\n' +
    '    "identifier": "com.xxx.upload",\n' +
    '    "profile": "ios-screenShareUpload.mobileprovision",\n' +
    '    "entitlements": {\n' +
    '      "com.apple.security.application-groups": ["group.com.xxx"]\n' +
    '    }\n' +
    '  }\n' +
    '}\n' +
    'Where each field comes from:\n' +
    '· identifier: the Extension Bundle ID. It must be the main app Bundle ID plus a suffix (e.g. if the main app is com.xxx, use com.xxx.upload), and must match the Bundle ID bound to the mobileprovision above\n' +
    '· profile: the file name of that mobileprovision (relative to nativeResources/ios)\n' +
    '· entitlements.com.apple.security.application-groups: the App Group ID created in the Apple Developer portal (in the form group.com.xxx). Both the main app and the Extension must enable the same one\n' +
    '3) UniApp.entitlements (App Groups entitlement on the main app side; the entitlements in ios-extension.json only apply to the Extension, the main app needs this file to share data with the Extension):\n' +
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
    '2. Create Info.plist in the project root and add TUIRoomAppGroup:\n' +
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<plist version="1.0">\n' +
    '  <dict>\n' +
    '    <key>TUIRoomAppGroup</key>\n' +
    '    <string>group.com.xxx</string>\n' +
    '  </dict>\n' +
    '</plist>\n' +
    'The three occurrences of group.com.xxx (application-groups in ios-extension.json, UniApp.entitlements, and TUIRoomAppGroup in Info.plist) must be exactly identical, otherwise publishing will fail.\n' +
    '\n' +
    '3. Rebuild the custom base to take effect.\n' +
    '\n' +
    'For detailed steps, see "Quick Integration > Advanced Features" on the official website.',

  // ===== Participant list =====
  'participants.members': 'Members',
  'participants.membersWithCount': 'Members({count})',
  'participants.invite': 'Invite',
  'participants.addMember': 'Add Member',
  'participants.inviteJoin': 'Invite to Join',
  'participants.searchPlaceholder': 'Search participants',
  'participants.emptyPending': 'No members outside the room',
  'participants.callAll': 'Call Everyone',
  'participants.guestWithCount': 'Guests({count})',
  'participants.enteredWithCount': 'In Room({count})',
  'participants.audienceWithCount': 'Audience({count})',
  'participants.pendingWithCount': 'Not Joined({count})',
  'participants.muteAll': 'Mute All',
  'participants.unmuteAll': 'Unmute All',
  'participants.banAllVideo': 'Disable All Video',
  'participants.unbanAllVideo': 'Enable All Video',
  'participants.muteAllTitle': 'All current and new members will be muted',
  'participants.unmuteAllTitle': 'All members will be unmuted',
  'participants.muteAllContent': 'Members will not be able to turn on their microphone',
  'participants.unmuteAllContent': 'Members will be free to turn on their microphone',
  'participants.banVideoTitle': 'Video will be disabled for all current and new members',
  'participants.unbanVideoTitle': 'Video will be enabled for all members',
  'participants.banVideoContent': 'Members will not be able to turn on their video',
  'participants.unbanVideoContent': 'Members will be free to turn on their video',
  'participants.confirmRelease': 'Confirm',
  'participants.inviteSent': 'Invitation sent, waiting for members to join',

  // ===== Participant item =====
  'participant.meTag': '(Me)',
  'participant.calling': 'Calling',
  'participant.rejected': 'Declined',
  'participant.call': 'Call',
  'participant.owner': 'Host',
  'participant.admin': 'Admin',

  // ===== Participant actions =====
  'participantAction.transferOwner': 'Transfer Host',
  'participantAction.kickOut': 'Remove from Room',
  'participantAction.transferTitle': 'Transfer host to {name}',
  'participantAction.transferMessage': 'You will become a regular member after transferring',
  'participantAction.kickMessage': 'Remove {name} from the room?',
  'participantAction.setAudience': 'Set as Audience',
  'participantAction.setGuest': 'Set as Guest',
  'participantAction.requestOpenAudio': 'Request to Unmute',
  'participantAction.requestOpenVideo': 'Request to Start Video',
  'participantAction.revokeAdmin': 'Revoke Admin',
  'participantAction.setAdmin': 'Set as Admin',
  'participantAction.transferred': 'Host transferred to {name}',
  'participantAction.adminRevoked': 'Revoked admin from {name}',
  'participantAction.adminSet': 'Set {name} as admin',

  // ===== Exit room =====
  'exit.leaveRoom': 'Leave Room',
  'exit.endRoom': 'End Room',
  'exit.ownerTip': 'If you do not want to end the room, assign a new host before leaving',
  'exit.memberTip': 'Are you sure you want to leave the room?',

  // ===== Room password =====
  'password.title': 'Room Password',
  'password.placeholder': 'Enter the room password',
  'password.join': 'Join Room',

  // ===== Tool panel =====
  'tool.expand': 'More',
  'tool.collapse': 'Less',

  // ===== Room info =====
  'roomInfo.owner': 'Host',
  'roomInfo.roomId': 'Room ID',
  'roomInfo.copyAll': 'Copy Room Info',
  'roomInfo.roomIdCopied': 'Room ID copied',
  'roomInfo.allInfo': 'Room name: {roomName}\nRoom ID: {roomId}',
  'roomInfo.infoCopied': 'Room info copied',

  // ===== Invite sheet (in-meeting / scheduled) =====
  'inviteSheet.defaultTitle': 'Invite Members',
  'inviteSheet.roomName': 'Room Name',
  'inviteSheet.roomTime': 'Room Time',
  'inviteSheet.roomId': 'Room ID',
  'inviteSheet.roomPassword': 'Room Password',
  'inviteSheet.copyAll': 'Copy Room Info',
  'inviteSheet.meetingNo': 'Meeting {roomId}',
  'inviteSheet.meetingInvite': 'Meeting Invitation',
  'inviteSheet.lineRoomName': 'Room name: {value}',
  'inviteSheet.lineRoomTime': 'Room time: {value}',
  'inviteSheet.lineRoomId': 'Room ID: {value}',
  'inviteSheet.lineRoomPassword': 'Room password: {value}',
  'inviteSheet.roomIdCopied': 'Room ID copied',
  'inviteSheet.passwordCopied': 'Password copied',
  'inviteSheet.infoCopied': 'Room info copied',

  // ===== Recording =====
  'recording.record': 'Record',
  'recording.recording': 'Recording',

  // ===== Chat =====
  'chat.title': 'Chat',
  'chat.newMessage': 'New Message',
  'chat.newMessageBracket': '[New Message]',
  'chat.textMessage': '[Text]',
  'chat.image': '[Image]',
  'chat.video': '[Video]',
  'chat.audio': '[Voice]',
  'chat.file': '[File]',

  // ===== Schedule room =====
  'schedule.roomName': 'Room Name',
  'schedule.roomNamePlaceholder': 'Enter room name',
  'schedule.startTime': 'Start Time',
  'schedule.duration': 'Duration',
  'schedule.timezone': 'Time Zone',
  'schedule.attendees': 'Attendees',
  'schedule.encrypt': 'Room Encryption',
  'schedule.password': 'Room Password',
  'schedule.passwordPlaceholder': 'Enter a 6-digit password',
  'schedule.muteAll': 'Mute All',
  'schedule.banAllVideo': 'Disable All Video',
  'schedule.successInviteTitle': 'Scheduled. Invite them to join',
  'schedule.editTitle': 'Edit Room',
  'schedule.createTitle': 'Schedule Room',
  'schedule.submitCreate': 'Schedule Room',
  'schedule.tempRoomSuffix': "'s Quick Room",
  'schedule.saveSuccess': 'Saved',

  // ===== Schedule list =====
  'scheduleList.enter': 'Enter',
  'scheduleList.empty': 'No scheduled rooms',
  'scheduleList.running': 'Ongoing',
  'scheduleList.notStarted': 'Not Started',

  // ===== Schedule detail =====
  'scheduleDetail.title': 'Room Details',
  'scheduleDetail.roomPassword': 'Room Password',
  'scheduleDetail.organizer': 'Organizer',
  'scheduleDetail.enterRoom': 'Enter Room',
  'scheduleDetail.inviteMember': 'Invite Members',
  'scheduleDetail.cancelRoom': 'Cancel Room',
  'scheduleDetail.attendeesTitle': 'Attendees ({count})',
  'scheduleDetail.cancelMessage':
    'Once canceled, other members will not be able to join this room. Cancel it?',
  'scheduleDetail.cancelLater': 'Not Now',
  'scheduleDetail.destroyedTitle': 'Room Destroyed',
  'scheduleDetail.destroyedMessage': 'This room has been destroyed. Tap OK to go back.',
  'scheduleDetail.passwordCopied': 'Password copied',
};
