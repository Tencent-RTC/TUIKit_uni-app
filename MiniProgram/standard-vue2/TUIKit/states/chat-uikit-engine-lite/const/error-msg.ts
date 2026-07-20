export enum ERROR_MSG {
  MSG_MODIFY_CONFLICT = 'MODIFY_MESSAGE_ERROR,修改消息发生冲突, data.message 是最新的消息',
  MSG_MODIFY_DISABLED_IN_AVCHATROOM = 'MODIFY_MESSAGE_ERROR,不支持修改直播群消息.',
  MODIFY_MESSAGE_NOT_EXIST = 'MODIFY_MESSAGE_ERROR,消息不存在.',
}

export enum ERROR_MSG_ENGINE {
  NOT_INIT = 'TUIChatEngine 初始化未完成，请确认 TUIChatEngine.login 接口调用是否正常。',
  INVALID_CONV_ID = '会话 ID 无效',
  CONV_ID_SAME = '您切换的是同一个会话 ID',
  CONV_NOT_EXIST = '会话不存在',
  GET_MSG_LIST_ERROR = 'Chat SDK is not ready.',
  MISMATCH_TYPE_AND_PAYLOAD = 'type 与 payload 不匹配.',
}
