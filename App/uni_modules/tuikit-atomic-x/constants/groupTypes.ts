/**
 * 群类型定义和描述常量
 */

// 群类型接口定义
export interface GroupType {
  id: string
  name: string
  description: string
  docUrl?: string
}

// 群类型常量
export const GROUP_TYPES: GroupType[] = [
  {
    id: 'Work',
    name: '好友工作群(Work)',
    description: '好友工作群(Work): 类似普通微信群，创建后仅支持已在群内的好友邀请加群，且无需被邀请方同意或群主审批。',
    docUrl: 'https://cloud.tencent.com/product/im'
  },
  {
    id: 'Public',
    name: '陌生人社交群(Public)',
    description: '陌生人社交群(Public): 类似 QQ 群，创建后群主可以指定群管理员，用户搜索群 ID 发起加群申请后，需要群主或管理员审批通过才能入群。',
    docUrl: 'https://cloud.tencent.com/product/im'
  },
  {
    id: 'Meeting',
    name: '临时会议群(Meeting)',
    description: '临时会议群(Meeting): 创建后可以随意进出，且支持查看入群前消息；适用于音视频会议场景、在线教育场景等与实时音视频产品结合的场景。',
    docUrl: 'https://cloud.tencent.com/product/im'
  },
  // {
  //  id: 'AVChatRoom',
  //  name: '直播群(AVChatRoom)',
  //  description: '直播群(AVChatRoom）：创建后可以随意进出，没有群成员数量上限，但不支持历史消息存储；适合于直播产品结合，用于弹幕聊天场景。',
  //  docUrl: 'https://cloud.tencent.com/product/im'
  // }
]

// 根据ID获取群类型信息
export const getGroupTypeById = (id: string): GroupType | undefined => {
  return GROUP_TYPES.find(type => type.id === id)
}

// 获取群类型名称
export const getGroupTypeName = (id: string): string => {
  const groupType = getGroupTypeById(id)
  return groupType?.name || '未知群类型'
}

// 获取群类型描述
export const getGroupTypeDescription = (id: string): string => {
  const groupType = getGroupTypeById(id)
  return groupType?.description || ''
}

// 群头像资源常量
export const GROUP_AVATAR_BASE_URL = 'https://im.sdk.qcloud.com/download/tuikit-resource/group-avatar/'
export const GROUP_AVATAR_COUNT = 24

// 生成群头像URL列表
export const generateGroupAvatarUrls = (count: number = 10): string[] => {
  const urls: string[] = []
  for (let i = 1; i <= count; i++) {
    urls.push(`${GROUP_AVATAR_BASE_URL}group_avatar_${i}.png`)
  }
  return urls
}

// 默认群头像列表（10个）
export const DEFAULT_GROUP_AVATARS = generateGroupAvatarUrls(10)