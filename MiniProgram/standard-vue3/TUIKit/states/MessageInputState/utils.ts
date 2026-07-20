import { MessageContentType } from './type';
import type { InputContent } from './type';

function convertInputContentToEditorNode(item: InputContent) {
  switch (item.type) {
    case MessageContentType.TEXT:
      return {
        type: 'text',
        text: item.content,
      };
    case MessageContentType.IMAGE: {
      const imageFile = item.content as File;
      const imageUrl = URL.createObjectURL(imageFile);
      return {
        type: MessageContentType.IMAGE,
        attrs: {
          src: imageUrl,
          alt: imageFile?.name,
          fileData: imageFile,
          title: imageFile?.name,
        },
      };
    }
    case MessageContentType.EMOJI: {
      const emoticonContent = item.content as { url: string; key: string; text: string };
      return {
        type: MessageContentType.EMOJI,
        attrs: {
          src: emoticonContent.url,
          alt: emoticonContent.key,
          title: emoticonContent.text,
        },
      };
    }
    default:
      return {
        type: 'text',
        text: String(item.content),
      };
  }
}

export {
  convertInputContentToEditorNode,
};
