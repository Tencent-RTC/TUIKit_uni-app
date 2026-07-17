import type { Message } from '@tencentcloud/lite-chat/basic';

// message handler 因为需要在 MessageModel 中调用，需要保留声明文件
export interface IMessageHandler {
  /**
   * 处理文本消息
   * @param {Message} message 文本消息
  */
  handleTextMessage(message: Message): object;

  /**
   * 处理图片消息
   * @param {Message} message 图片消息
  */
  handleImageMessage(message: Message): object;

  /**
   * 处理视频消息
   * @param {Message} message 视频消息
  */
  handleVideoMessage(message: Message): object;

  /**
   * 处理自定义消息
   * @param {Message} message 自定义消息
  */
  handleCustomMessage(message: Message): object;

  /**
   * 处理群提示消息
   * @param {Message} message 群 tips 消息
  */
  handleGroupTipsMessage(message: Message): object;

  /**
   * 处理群系统消息
   * @param {Message} message 群系统消息
  */
  handleGroupSystemMessage(message: Message): object;

  /**
   * 处理音视频通话信令
   * @param {any} message 会话最后一条消息或漫游消息
  */
  handleCallKitSignaling(message: any): string | undefined;
}
