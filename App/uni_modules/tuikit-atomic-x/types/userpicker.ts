enum UserPickerType {
    // 发起C2C会话
    C2C_CONVERSATION = 1,
    // 创建群聊
    CREATE_GROUP = 2,
    // 删除群成员
    REMOVE_GROUP_MEMBER = 3,
    // 邀请群成员
    INVITE_GROUP_MEMBER = 4,
    // 晋升管理员
    PROMOTE_ADMIN = 5,
    // 降级管理员
    DEMOTE_ADMIN = 6,
    // 禁言群成员
    MUTE_GROUP_MEMBER = 7,
    // 取消禁言群成员
    UNMUTE_GROUP_MEMBER = 8,
    // 转交群主
    TRANSFER_GROUP_OWNER = 9,
    // 选择群成员
    SELECT_GROUP_MEMBER = 10
};

export { UserPickerType }
