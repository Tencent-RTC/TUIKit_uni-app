enum MessageContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  MENTION = 'mention',
  EMOJI = 'emoji',
}

type ContentTypeMap = {
  [key in MessageContentType]: key extends MessageContentType.TEXT
  ? string
  : key extends MessageContentType.IMAGE
  ? File
  : key extends MessageContentType.VIDEO
  ? File
  : key extends MessageContentType.FILE
  ? File
  : key extends MessageContentType.MENTION
  ? string[]
  : key extends MessageContentType.EMOJI
  ? { url: string; key: string; text: string }
  : never;
};

interface InputContent<T extends MessageContentType = MessageContentType> {
  type: T;
  content: ContentTypeMap[T];
}

export {
  MessageContentType,
};

export type {
  ContentTypeMap,
  InputContent,
};
