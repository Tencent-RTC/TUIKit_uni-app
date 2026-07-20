export const UI_PLATFORM = {
    UNI_MINI_APP: '49'
}

export enum MessageType {
    MSG_TEXT = 'TIMTextElem',
    MSG_CUSTOM = 'TIMCustomElem',
    MSG_IMAGE = 'TIMImageElem',
    MSG_VIDEO = 'TIMVideoFileElem',
    MSG_GRP_TIP = 'TIMGroupTipElem'
}

export enum MessageContentType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    FILE = 'file',
    MENTION = 'mention',
    EMOJI = 'emoji',
}

export enum CONV_TYPE {
    C2C = 'C2C',
    GROUP = 'GROUP'
}