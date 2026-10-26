const LIVE_ERROR_MAP: Record<number, string> = {
	[-1001]: 'LiveError.Common.NotCreated',
	[-2105]: 'LiveError.Create.IllegalId',
	[-2107]: 'LiveError.Create.IllegalTitle',
	[-2108]: 'LiveError.Create.AlreadyInRoom',
	[100001]: 'LiveError.Common.Server',
	[100002]: 'LiveError.Common.InvalidParameter',
	[100003]: 'LiveError.Create.IdUsed',
	[100004]: 'LiveError.Create.RoomNotFound',
	[100011]: 'LiveError.Create.IdOccupied',
	[100012]: 'LiveError.Common.TooFrequent',
	[100026]: 'LiveError.Create.SensitiveName',
};

export { LIVE_ERROR_MAP };
