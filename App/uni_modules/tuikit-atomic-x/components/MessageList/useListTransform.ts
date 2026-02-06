import { ref, watch, nextTick } from 'vue';

interface UseListTransformOptions {
  getInputPanelHeight: () => number;
  getInputToolbarHeight: () => number;
  getLastMessageBottom: () => Promise<number>;
  getMessageCount: () => number;
  listRef: any;
  threshold?: number; // 消息数量阈值，默认 10
}

/**
 * 消息列表智能 Transform Hook
 * 
 * 功能：根据键盘/面板高度智能计算消息列表的上移距离
 * 
 * 场景：
 * 1. 消息超一屏：直接上移面板高度
 * 2. 消息不足一屏：智能计算，只上移必要距离
 * 3. 键盘打开时收到新消息：重新计算上移距离
 */
export function useListTransform(options: UseListTransformOptions) {
  const {
    getInputPanelHeight,
    getInputToolbarHeight,
    getLastMessageBottom,
    getMessageCount,
    listRef,
    threshold = 10
  } = options;

  const animation = uni.requireNativePlugin('animation');

  // ==================== 状态 ====================
  // 是否需要智能计算（键盘弹出时消息不足一屏时为 true，直到键盘关闭才重置）
  const needSmartTransform = ref(false);
  // 当前已应用的 translateY 值
  const currentTranslateY = ref(0);

  // ==================== 纯函数 ====================
  
  /**
   * 计算需要上移的距离
   * @param originalBottom 最后一条消息底部的原始位置（未 transform 前）
   * @returns 需要上移的距离，0 表示不需要上移
   */
  const calcTranslateY = (originalBottom: number): number => {
    const systemInfo = uni.getSystemInfoSync();
    const screenHeight = systemInfo.screenHeight;
    const panelHeight = getInputPanelHeight();
    const toolbarHeight = getInputToolbarHeight();
    
    // 可用空间 = 屏幕高度 - 消息底部位置 - 工具栏高度
    const availableSpace = screenHeight - originalBottom - toolbarHeight;
    
    // 面板高度超过可用空间时，需要上移差值
    if (panelHeight > availableSpace) {
      return panelHeight - availableSpace;
    }
    return 0;
  };

  /**
   * 还原原始位置（将 transform 后的位置还原为原始位置）
   * @param currentBottom 当前获取到的位置（transform 后的屏幕位置）
   * @returns 原始位置
   */
  const restoreOriginalBottom = (currentBottom: number): number => {
    return currentBottom + currentTranslateY.value;
  };

  // ==================== 副作用函数 ====================
  
  /**
   * 执行 transform 动画
   */
  const applyTransform = (translateY: number) => {
    currentTranslateY.value = translateY;
    nextTick(() => {
      if (!listRef.value) return;
      animation.transition(
        listRef.value,
        {
          styles: { transform: `translateY(-${translateY}px)` },
          duration: 200,
          timingFunction: 'ease-out'
        }
      );
    });
  };

  /**
   * 重置所有状态
   */
  const resetState = () => {
    needSmartTransform.value = false;
    currentTranslateY.value = 0;
    applyTransform(0);
  };

  // ==================== 业务函数 ====================
  
  /**
   * 处理面板高度变化
   * @param isOpening 是否是从关闭到打开（oldHeight === 0）
   */
  const onPanelHeightChange = async (isOpening: boolean) => {
    const panelHeight = getInputPanelHeight();
    
    // 面板关闭
    if (panelHeight === 0) {
      resetState();
      return;
    }

    // 首次打开面板时，根据消息数量决定是否需要智能计算
    if (isOpening) {
      needSmartTransform.value = getMessageCount() < threshold;
    }

    if (needSmartTransform.value) {
      // 智能计算模式
      const currentBottom = await getLastMessageBottom();
      // 首次打开时 currentTranslateY 为 0，所以 originalBottom === currentBottom
      const originalBottom = restoreOriginalBottom(currentBottom);
      const translateY = calcTranslateY(originalBottom);
      applyTransform(translateY);
    } else {
      // 直接上移面板高度
      applyTransform(panelHeight);
    }
  };

  /**
   * 处理新消息到达（仅在 needSmartTransform 为 true 时需要调用）
   */
  const onNewMessage = async () => {
    if (!needSmartTransform.value) return;
    if (getInputPanelHeight() === 0) return;

    // 等待 DOM 更新和滚动完成
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const currentBottom = await getLastMessageBottom();
    const originalBottom = restoreOriginalBottom(currentBottom);
    const translateY = calcTranslateY(originalBottom);
    applyTransform(translateY);
  };

  return {
    // 状态（只读）
    needSmartTransform,
    currentTranslateY,
    // 业务函数
    onPanelHeightChange,
    onNewMessage,
    resetState
  };
}
