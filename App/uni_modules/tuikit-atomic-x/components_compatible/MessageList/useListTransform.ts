/**
 * 消息列表智能 Transform (Vue2/Vue3 兼容版)
 *
 * 功能：根据键盘/面板高度智能计算消息列表的上移距离
 *
 * 场景：
 * 1. 消息超一屏：直接上移面板高度
 * 2. 消息不足一屏：智能计算，只上移必要距离
 * 3. 键盘打开时收到新消息：重新计算上移距离
 */
export function useListTransform(options: any) {
  var getInputPanelHeight = options.getInputPanelHeight;
  var getInputToolbarHeight = options.getInputToolbarHeight;
  var getLastMessageBottom = options.getLastMessageBottom;
  var getMessageCount = options.getMessageCount;
  var listRef = options.listRef;
  var threshold = options.threshold || 10;

  var animation = uni.requireNativePlugin('animation');

  // 状态
  var needSmartTransform = false;
  var currentTranslateY = 0;

  function calcTranslateY(originalBottom: number): number {
    var systemInfo = uni.getSystemInfoSync();
    var screenHeight = systemInfo.screenHeight;
    var panelHeight = getInputPanelHeight();
    var toolbarHeight = getInputToolbarHeight();
    var availableSpace = screenHeight - originalBottom - toolbarHeight;
    if (panelHeight > availableSpace) {
      return panelHeight - availableSpace;
    }
    return 0;
  }

  function restoreOriginalBottom(currentBottom: number): number {
    return currentBottom + currentTranslateY;
  }

  function applyTransform(translateY: number) {
    currentTranslateY = translateY;
    var el = typeof listRef === 'function' ? listRef() : listRef;
    if (!el) return;
    animation.transition(
      el,
      {
        styles: { transform: 'translateY(-' + translateY + 'px)' },
        duration: 200,
        timingFunction: 'ease-out'
      }
    );
  }

  function resetState() {
    needSmartTransform = false;
    currentTranslateY = 0;
    applyTransform(0);
  }

  function onPanelHeightChange(isOpening: boolean) {
    var panelHeight = getInputPanelHeight();
    if (panelHeight === 0) {
      resetState();
      return;
    }
    if (isOpening) {
      needSmartTransform = getMessageCount() < threshold;
    }
    if (needSmartTransform) {
      getLastMessageBottom().then(function(currentBottom: number) {
        var originalBottom = restoreOriginalBottom(currentBottom);
        var translateY = calcTranslateY(originalBottom);
        applyTransform(translateY);
      });
    } else {
      applyTransform(panelHeight);
    }
  }

  function onNewMessage() {
    if (!needSmartTransform) return;
    if (getInputPanelHeight() === 0) return;
    setTimeout(function() {
      getLastMessageBottom().then(function(currentBottom: number) {
        var originalBottom = restoreOriginalBottom(currentBottom);
        var translateY = calcTranslateY(originalBottom);
        applyTransform(translateY);
      });
    }, 150);
  }

  return {
    get needSmartTransform() { return needSmartTransform; },
    get currentTranslateY() { return currentTranslateY; },
    onPanelHeightChange: onPanelHeightChange,
    onNewMessage: onNewMessage,
    resetState: resetState
  };
}
