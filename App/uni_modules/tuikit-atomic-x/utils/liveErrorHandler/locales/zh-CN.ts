export const zhCN : Record<string, string> = {
	'LiveError.Common.NotCreated': '直播间尚未创建成功，无法执行该操作',
	'LiveError.Common.Server': '服务器开小差了，请稍后重试',
	'LiveError.Common.InvalidParameter': '请求参数非法，请根据错误描述检查请求是否正确',
	'LiveError.Common.TooFrequent': '操作过于频繁，请稍后重试',
	'LiveError.Create.IllegalId': '直播 ID 非法，请使用字母、数字组合后重试',
	'LiveError.Create.IllegalTitle': '直播标题非法，请修改后重试',
	'LiveError.Create.AlreadyInRoom': '已在其他直播间中，请先退出后再开播',
	'LiveError.Create.IdUsed': '该直播 ID 已被使用，请更换后重试',
	'LiveError.Create.RoomNotFound': '直播间不存在或已被解散',
	'LiveError.Create.IdOccupied': '直播 ID 已被占用，请更换后重试',
	'LiveError.Create.SensitiveName': '直播名称包含敏感词，请修改后重试',
	'LiveError.Fallback': '操作失败，请稍后重试（错误码 {code}）',
}
