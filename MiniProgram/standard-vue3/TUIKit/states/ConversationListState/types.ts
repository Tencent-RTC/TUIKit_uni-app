export interface GroupMemberItem {
    userID: string;
    role?: string;
    memberCustomField?: any[];
}

export interface CreateGroupParams {
    name: string;
    type: string;
    groupID?: string;
    introduction?: string;
    notification?: string;
    avatar?: string;
    maxMemberNum?: number;
    joinOption: string;
    memberList?: GroupMemberItem[];
    groupCustomField?: any[];
    isSupportTopic?: boolean;
}