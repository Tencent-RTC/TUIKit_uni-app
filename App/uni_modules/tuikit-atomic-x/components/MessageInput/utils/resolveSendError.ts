interface SendError extends Error {
  errCode: number;
}

function resolveSendError(error: SendError): string {
  switch (error.errCode) {
    // 用户关系相关
    case 20007:
      return '您已被对方拉黑';
    case 20009:
      return '双方非好友，禁止发送';
    case 20010:
      return '您不是对方的好友，禁止发送';
    case 20011:
      return '对方不是您的好友，禁止发送';
    
    // 权限相关
    case 20012:
      return '您处于禁言状态';
    case 20006:
      return '消息禁止发送';
    
    // 账号相关
    case 20002:
      return '登录已失效，请重新登录';
    case 20003:
      return '账号无效或不存在';
    case 20008:
      return '账号异常，请清理缓存后重试';
    
    // 网络和服务端错误
    case 20004:
      return '网络异常，请重试';
    case 20005:
      return '服务端错误，请重试';
    case 20027:
      return '消息版本冲突，请重试';
    case 20028:
      return '消息冲突，请重试';
    
    // 请求相关
    case 20001:
      return '请求异常，请重试';
    case 22006:
      return '请求过于频繁，请稍后再试';
    case 22007:
      return '超出免费额度限制';
    
    // 消息内容相关
    case 90055:
    case 93000:
      return '消息内容过长，请减少内容后重试';
    case 90995:
      return '消息过长，请减少内容';
    
    // 服务端内部错误
    case 90992:
      return '消息回调错误，请重试';
    case 90994:
    case 91000:
      return '服务内部错误，请重试';

    // 群组相关
    case 10010:
      return '群聊不存在';
    case 10007:
      return '您不属于该群聊';
    case 10017:
      return '您被禁言，无法发送消息';
    
    default:
      return '消息发送失败';
  }
}

export {
    resolveSendError,
}