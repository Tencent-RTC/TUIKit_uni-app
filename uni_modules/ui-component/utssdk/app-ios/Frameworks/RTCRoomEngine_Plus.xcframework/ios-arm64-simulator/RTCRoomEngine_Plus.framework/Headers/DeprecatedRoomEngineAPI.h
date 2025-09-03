/**
 * Copyright (c) 2024 Tencent. All rights reserved.
 */
#import "TUIRoomEngine.h"

@class TRTCCloud;
@class TXDeviceManager;
@class TXAudioEffectManager;
@class TXBeautyManager;

NS_ASSUME_NONNULL_BEGIN
@interface TUIRoomEngine (deprecated)

/////////////////////////////////////////////////////////////////////////////////
//
//                    弃用接口（建议使用对应的新接口）
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 获得设备管理对象
 *
 * @deprecated v1.5.0 版本开始不推荐使用。
 */
- (TXDeviceManager *)getDeviceManager NS_SWIFT_NAME(getDeviceManager()) __attribute__((deprecated("Deprecated from v1.5.0")));

/**
 * 获得音效管理对象
 *
 * @deprecated v1.5.0 版本开始不推荐使用。
 */
- (TXAudioEffectManager *)getAudioEffectManager NS_SWIFT_NAME(getAudioEffectManager()) __attribute__((deprecated("Deprecated from v1.5.0")));

/**
 * 获得美颜管理对象
 *
 * @deprecated v1.5.0 版本开始不推荐使用。
 */
- (TXBeautyManager *)getBeautyManager NS_SWIFT_NAME(getBeautyManager()) __attribute__((deprecated("Deprecated from v1.5.0")));

/**
 * 设置本地用户视频渲染的视图控件
 *
 * @deprecated v1.6.1 版本开始不推荐使用。
 */
- (void)setLocalVideoView:(TUIVideoStreamType)streamType view:(TUIVideoView *__nullable)view NS_SWIFT_NAME(setLocalVideoView(streamType:view:)) __attribute__((deprecated("Deprecated from v1.6.1")));

#if TARGET_OS_IPHONE

/**
 * 切换前置或后置摄像头（仅适用于移动端）
 *
 * @deprecated v2.0 版本开始不推荐使用,建议使用{$TUIRoomDeviceManager$}中的{@link switchCamera}代替。
 * @return 0：操作成功；负数：操作失败。
 */
- (NSInteger)switchCamera:(BOOL)frontCamera NS_SWIFT_NAME(switchCamera(frontCamera:)) __attribute__((deprecated("Deprecated from v2.0")));

#endif

#if !TARGET_OS_IPHONE && TARGET_OS_MAC

/**
 * 获取设备列表（仅适用于桌面端）
 *
 * @deprecated v2.0 版本开始不推荐使用,建议使用{$TUIRoomDeviceManager$}中的{@link getDevicesList}代替。
 * @param type  设备类型，指定需要获取哪种设备的列表。详见 TXMediaDeviceType 定义。
 * @note
 * - 使用完毕后请调用 release 方法释放资源，这样可以让 SDK 维护 ITXDeviceCollection 对象的生命周期。
 *   - 不要使用 delete 释放返回的 Collection 对象，delete ITXDeviceCollection* 指针会导致异常崩溃。
 *   - type 只支持 TXMediaDeviceTypeMic、TXMediaDeviceTypeSpeaker、TXMediaDeviceTypeCamera。
 *   - 此接口只支持 Mac 和 Windows 平台。
 */
- (NSArray<TXMediaDeviceInfo *> *_Nullable)getDevicesList:(TUIMediaDeviceType)type NS_SWIFT_NAME(getDevicesList(type:)) __attribute__((deprecated("Deprecated from v2.0")));

/**
 * 设置当前要使用的设备（仅适用于桌面端）
 *
 * @deprecated v2.0 版本开始不推荐使用,建议使用{$TUIRoomDeviceManager$}中的{@link setCurrentDevice}代替。
 * 设置当前要使用的设备后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onDeviceChanged} 通知您。
 * @param type 设备类型，详见 TXMediaDeviceType 定义。
 * @param deviceId 设备ID，您可以通过接口 {@link getDevicesList} 获得设备 ID。
 * @return 0：操作成功；负数：操作失败。
 */
- (NSInteger)setCurrentDevice:(TUIMediaDeviceType)type deviceId:(NSString *)deviceId NS_SWIFT_NAME(setCurrentDevice(type:deviceId:)) __attribute__((deprecated("Deprecated from v2.0")));

#endif

/**
 * 调用实验性接口
 *
 * @deprecated v3.0 版本开始不推荐使用
 * @note 此函数支持会议房间类型和直播房间类型({@link TUIRoomTypeConference} & {@link TUIRoomTypeLive})。
 * @param  jsonStr 接口信息。
 * @return 返回结果
 */
+ (id)callExperimentalAPI:(NSString *)jsonStr NS_SWIFT_NAME(callExperimentalAPI(jsonStr:)) __attribute__((deprecated("Deprecated from v3.0")));

NS_ASSUME_NONNULL_END
@end
