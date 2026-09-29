<template>
  <!-- 收起态输入入口:视觉由本 nvue 胶囊提供(与操作按钮同层,弹层能正常盖住),
       点击命中由覆盖其上的【透明】常驻 webview(H5 editor)接管——既解决层级(drawer 遮挡),
       又保留"真实点击才弹键盘"。placeholderRef 的实测 rect 用于把 webview 对齐到胶囊。 -->
  <view class="barrage-input-root" ref="placeholderRef">
    <text class="barrage-input-ph">{{ entryPlaceholder }}</text>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from "vue";
  import { useBarrageState } from "@/uni_modules/tuikit-atomic-x/state/BarrageState";
  import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
  import { transformEmojiNameToKey } from '@/uni_modules/tuikit-atomic-x/utils/emojiUtils';

  const placeholderRef = ref<any>(null);

  const { sendTextMessage } = useBarrageState(uni?.$liveID);
  const { messageBannedUserList } = useLiveAudienceState(uni?.$liveID);

  const isDisableSendMessage = ref(false);
  const entryPlaceholder = computed(() => isDisableSendMessage.value ? '您已被禁言' : '说点什么....');
  const syncBannedToH5 = () => {
    // #ifdef APP-PLUS
    try {
      inputWebview?.evalJS('window.__setBanned && window.__setBanned(' + (isDisableSendMessage.value ? 'true' : 'false') + ');');
    } catch (e) { /* ignore */ }
    // #endif
  };

  // H5 键盘页面路径:指向【插件自己】的 static(uni_modules/tuikit-atomic-x/static/),
  // 打包时会随插件目录拷进 app 的 www(产物路径 /uni_modules/tuikit-atomic-x/static/...,
  // 与 /static/... 同为 www 根相对路径,webview 可直接加载)。
  // 此前指向项目根 /static/emojiKeyboardH5/——插件单独发布时宿主项目没有该文件,
  // webview 404、H5 键盘完全失效。插件内自包含后 BarrageInput 开箱即用。
  const H5_URL = '/uni_modules/tuikit-atomic-x/static/emojiKeyboardH5/EmojiKeyboard.html';
  const WEBVIEW_ID = 'barrage-input-webview';

  // 常驻覆盖层 webview。
  let inputWebview: any = null;
  // 组件是否已卸载。防止「挂载 timer / measurePlaceholder 异步回调」在卸载后
  // 仍创建 webview 造成泄漏:泄漏的透明 webview 常驻输入胶囊位置(原生层级
  // 高于一切 nvue view),连麦控制条展开时盖在其上方,点击控制条左侧会命中
  // editor 弹出键盘("点击设备浮层穿透到输入框"的根因)。
  let disposed = false;
  // 挂载延迟创建 webview 的 timer(onMounted 里 setTimeout 300ms),卸载时清除。
  let mountTimer: any = null;
  // 收起态几何(仅左下输入条区域,宿主 footer 右侧操作按钮保持可见可点)。单位 px。
  let collapsedHeightPx = 100;
  let collapsedLeftPx = 0;
  let collapsedWidthPx = 0;
  let collapsedTopPx = 0;
  let expanded = false;
  // 宿主当前是否要求隐藏输入 webview(有弹层盖住输入胶囊区域,barrageInput:setHidden 驱动)。
  // expandWebview 据此拦截"弹层遮挡期间点击穿透到 H5 editor"引发的错误展开。
  let hiddenByOverlay = false;
  // webview 是否已处于「移出屏幕」位置(原生侧已应用)。用于跳过重复 setStyle,并让
  // collapseWebview 收起时能按 hiddenByOverlay 决定落点。
  let webviewHiddenApplied = false;
  // 恢复(移回屏幕)延迟 timer:见 setWebviewHidden 的恢复分支注释。
  let webviewRestoreTimer: any = null;
  // 移出屏幕的 top(px):用屏幕高兜底大值,确保完全不可见。
  const offscreenTopPx = () => {
    try { return uni.getSystemInfoSync().screenHeight || 99999; } catch (e) { return 99999; }
  };

  // 注入 H5 的键盘高度(px)。adjustPan 下 webview 不会被 resize,H5 自身感知不到
  // 键盘;由原生监听 uni.onKeyboardHeightChange 经 evalJS 推给 H5,H5 据此把输入
  // dock 定位到键盘上方。
  let lastInjectedKb = -1;

  // 主页消息列表「让位高度」模型【top 定位版·2026-08 定稿,两类机型通吃、零闪动】:
  //  - lastKbHeight：最近一次的非零系统键盘高度(= kbFull 语义,不含 H5 SAFE_EXTRA_PX)。
  //  - inPanelMode：当前是否表情态（H5 通过 'panel'/'kb' 信号告知）。
  // 让位值语义:本组件 emit 的是"消息列表底部相对屏幕底应额外抬高多少"。宿主
  //   videoView 用它算出列表【相对屏幕顶的 top】(top 定位,不受键盘顶起视口影响)。
  //     收起态:emit 0        (列表贴底部输入框上方)
  //     键盘态:emit kbFull   (列表抬高一个键盘高,贴被顶起的输入框上方)
  //     表情态:emit kbFull   (与键盘态【同值】=> top 相同 => 键盘↔表情列表纹丝不动)
  // 为何键盘态也 emit 全额(而非旧 bottom 方案的 0):列表改用 top 定位后不再受系统
  //   对 fixed 视口顶起的影响,让位完全由我们控制;两态同值 => top 一致 => 切换零位移
  //   零闪动(旧 bottom 方案键盘态靠系统视口顶起、表情态靠 bottom 补偿,两者速率不
  //   匹配才闪;top 定位从根上消除)。
  // 让位【emit 时机】统一交给 injectKbHeight(系统键盘真实收/弹回调),H5 的 panel/kb
  //   信号只记录目标态 inPanelMode、不直接 emit。
  let lastKbHeight = 0;
  let inPanelMode = false;
  // 平台判断:iOS 的 onKeyboardHeightChange 在本 webview 场景只回调 0(拿不到真实
  // 键盘高),iOS 的键盘高/#bar 定位/消息列表让位全靠 H5 的 visualViewport 自感知
  // 并通过 shift/panel/kb 信号驱动。故 iOS 下 injectKbHeight 完全不干预——尤其
  // 【不能】用回调的 0 去 evalJS __setKbHeight(0),否则会把 H5 自校准的 injectedKbH
  // 打回 0、kbFull 永远锁不定,导致 #bar 贴不到键盘顶(本轮 iOS 回归的根因)。
  const isIOSPlatform = (() => {
    try { return ((uni.getSystemInfoSync().platform || '').toLowerCase().indexOf('ios') >= 0); }
    catch (e) { return false; }
  })();
  const emitHostShift = (px: number, src?: string) => {
    const v = Math.max(0, Math.round(px || 0));
    try { uni.$emit('barrageInput:shift', v); } catch (e) { /* ignore */ }
  };

  const injectKbHeight = (px: number) => {
    // #ifdef APP-PLUS
    try {
      const h = Math.max(0, Math.round(px || 0));
      // 注入键盘高给 H5(H5 的 __setKbHeight 对 0 安全:仅 v>40 且未锁定时才校准 kbFull,
      // 不会破坏已锁定值)。iOS 的 onKeyboardHeightChange 常回调 0,真实键盘高由 H5 自身
      // visualViewport 校准,故 iOS 的消息列表让位【不】在此 emit,交给 shift/panel/kb 信号。
      if (h > 0) lastKbHeight = h; // 记录最近的键盘高度
      if (h !== lastInjectedKb) {
        lastInjectedKb = h;
        inputWebview?.evalJS('window.__setKbHeight && window.__setKbHeight(' + h + ');');
      }
      // 消息列表让位(top 定位模型,两态同值=>切换零位移)。iOS 跳过(靠 H5 信号驱动),
      // 仅安卓在此 emit(安卓 onKeyboardHeightChange 回调真实键盘高)。
      if (isIOSPlatform) return;
      if (h > 0) {
        emitHostShift(lastKbHeight, 'inject-kb');
      } else if (inPanelMode) {
        emitHostShift(lastKbHeight, 'inject-panel');
      }
    } catch (e) {
      console.error('injectKbHeight error', e);
    }
    // #endif
  };
  const onKbHeightChange = (res: { height: number }) => {
    injectKbHeight((res && res.height) || 0);
  };

  // 把 webview 扩到全屏(承载激活态的遮罩 + 表情面板)。
  const expandWebview = () => {
    // #ifdef APP-PLUS
    if (!inputWebview || expanded) return;
    // 【弹层遮挡期间误触拦截】宿主已通过 barrageInput:setHidden 要求隐藏输入 webview(有
    // 弹层盖住输入胶囊区域)却仍收到 expand 信号——典型于"弹层弹起与点击穿透几乎同时
    // 到达"的时序竞态(setHidden 的 uni.$emit 与 H5 的 expand title 信号赛跑)。
    // 此时点击本就落在弹层上,不该展开输入:令 H5 中止展开并保持 webview 移出屏幕,
    // 否则错误展开的全屏 webview 会反过来盖住弹层、拦截其全部触摸。
    if (hiddenByOverlay) {
      try {
        inputWebview?.evalJS('window.__abortExpand && window.__abortExpand();');
      } catch (e) { /* ignore */ }
      return;
    }
    // 【禁言态禁止输入】已被主播禁言时：提示并阻止展开输入框。
    // 若仍展开，键盘会弹起但 H5 的 contenteditable 为 false，用户能弹键盘却打不了字，
    // 体验很差；直接在此拦截并给出 toast，与发送侧的拦截保持一致。
    // 同时这一刻 H5 必然已加载（用户能触发点击展开），故在此兜底同步一次禁言状态，
    // 确保 H5 侧 contenteditable 与原生状态一致。
    syncBannedToH5();
    if (isDisableSendMessage.value) {
      // 禁言：不展开（占位已显示"您已被禁言"），提示由宿主页面在状态变化时统一给出。
      // 关键：必须主动令 H5 中止展开。否则 H5 的 focus 兜底定时器会强行加 active(白底 #bar)，
      // 而 webview 停在收起态小尺寸 => 白底渲染成"白框"(禁言用户再进房点输入框变白的根因)。
      // __abortExpand 把 H5 强制拉回收起态,消除"原生拦截/H5 自行 active"的状态错位。
      try {
        inputWebview?.evalJS('window.__setBanned && window.__setBanned(true); window.__abortExpand && window.__abortExpand();');
      } catch (e) { /* ignore */ }
      return;
    }
    expanded = true;
    // 展开为全屏:胶囊位隐藏态语义失效,复位标记并取消未生效的恢复 timer
    //(否则迟到的恢复回调会在全屏展开后把 webview 挪回胶囊位)。
    webviewHiddenApplied = false;
    if (webviewRestoreTimer != null) { clearTimeout(webviewRestoreTimer); webviewRestoreTimer = null; }
    try {
      const sys = uni.getSystemInfoSync();
      const screenH = sys.screenHeight || 0;
      const screenW = sys.screenWidth || 0;
      // 关键：展开时必须同时把 left/width 恢复为全屏，否则 webview 仍是收起态的
      // 左下窄块，H5 输入栏被挤成窄竖条。用具体像素（部分 ROM 上 % 不稳）。
      // 显式再带 background/backgroundColor:transparent —— 部分 ROM 上 setStyle 改尺寸时，
      // webview 从底部窄块向上扩展，顶部新露出的区域会用默认白底填充，H5 内容重排铺满前
      // 会在顶部闪一条浅色横条。强制透明可消除该白条。
      inputWebview.setStyle({
        top: '0px', left: '0px', width: screenW + 'px', height: screenH + 'px',
        background: 'transparent', backgroundColor: 'transparent',
      });
      // webview 扩到全屏【之后】再让 H5 进入展开态（加深色底）。若在窄块阶段就加，
      // 深色底会铺满左下角窄块形成“深灰方块一闪”。setStyle 无回调，延迟一帧兜底。
      setTimeout(() => {
        try {
          const plat = (uni.getSystemInfoSync().platform || '').toLowerCase();
          inputWebview?.evalJS('window.__setPlatform && window.__setPlatform("' + plat + '");window.__enterActive && window.__enterActive();');
        } catch (err) { /* ignore */ }
      }, 16);
    } catch (e) {
      console.error('expandWebview error', e);
    }
    uni.$emit('barrageInput:show');
    uni.onKeyboardHeightChange(onKbHeightChange);
    // #endif
  };

  // 把 webview 缩回收起态的底部输入条区域。
  const collapseWebview = () => {
    // #ifdef APP-PLUS
    if (!inputWebview) return;
    expanded = false;
    // 收起落点:若此刻宿主仍要求隐藏(键盘/表情展开期间弹层可能已打开——彼时
    // setWebviewHidden 因 expanded 而 no-op,隐藏请求被丢弃),收起后必须【继续停在
    // 屏幕外】,不能回到胶囊位置盖在弹层上。否则形成「弹层开着但 webview 回到屏幕内」
    // 的稳定透传窗口(点击穿透到 H5 editor 错误弹起键盘)。
    const targetTop = hiddenByOverlay ? offscreenTopPx() : collapsedTopPx;
    webviewHiddenApplied = hiddenByOverlay;
    if (webviewRestoreTimer != null) { clearTimeout(webviewRestoreTimer); webviewRestoreTimer = null; }
    try {
      // 与 expandWebview 同款:显式带 background/backgroundColor:transparent——
      // 部分 ROM 上 setStyle 改尺寸时 webview surface 会用默认白底重绘新布局,
      // 键盘收起缩回窄条的瞬间,左下角胶囊位置闪一帧白色方块(随后 H5 重排恢复)
      // 的根因。强制透明消除该白闪。
      inputWebview.setStyle({
        top: targetTop + 'px',
        left: collapsedLeftPx + 'px',
        width: collapsedWidthPx + 'px',
        height: collapsedHeightPx + 'px',
        background: 'transparent', backgroundColor: 'transparent',
      });
      // webview 缩回窄块【之后】再让 H5 退出展开态（切收起态胶囊）。若在全屏阶段就
      // remove('active')，收起态 editor(100%) 会撑满全屏 => 屏幕中间闪一个大输入框。
      // setStyle 无回调，延迟一帧兜底。
      setTimeout(() => {
        try { inputWebview?.evalJS('window.__exitActive && window.__exitActive();'); } catch (err) { /* ignore */ }
      }, 16);
    } catch (e) {
      console.error('collapseWebview error', e);
    }
    uni.offKeyboardHeightChange(onKbHeightChange);
    lastInjectedKb = -1;
    // 收起：退出表情态、消息列表让位归零（回落到原始位置）。
    inPanelMode = false;
    emitHostShift(0, 'collapse');
    // footer(底部操作栏)立即恢复:安卓 adjustResize 下键盘收起是【同步 resize】,
    // 无 pan 平移的撤销延迟;消息列表已改 top 定位(不受键盘顶起影响)。故无需延迟,
    // 立即 emit——延迟会让操作栏"卡在原位等一会儿才落下"(问题2 卡顿的根因)。
    uni.$emit('barrageInput:hide');
    // #endif
  };

  // 测量失败时的兜底:用 rpx 估算收起态几何(与 video.nvue 的 .footer/.action-buttons 对齐)。
  const fillCollapsedByEstimate = () => {
    const sys = uni.getSystemInfoSync();
    const screenH = sys.screenHeight || 0;
    const screenW = sys.screenWidth || 0;
    const rpx = screenW / 750;
    const barBottomRpx = 80;
    const barHeightRpx = 72;
    collapsedHeightPx = Math.round(barHeightRpx * rpx);
    collapsedLeftPx = Math.round(32 * rpx);
    collapsedWidthPx = Math.round(310 * rpx);
    collapsedTopPx = screenH - Math.round(barBottomRpx * rpx) - collapsedHeightPx;
  };

  // 用 nvue dom 模块实测占位胶囊的真实屏幕 rect:nvue flex 布局产物,任意机型都
  // 准确(不依赖硬编码安全区/挖孔假设)。失败时退回 rpx 估算。
  const measurePlaceholder = (cb: () => void) => {
    // #ifdef APP-PLUS
    try {
      const dom = uni.requireNativePlugin('dom');
      const el = placeholderRef.value;
      if (dom && el) {
        dom.getComponentRect(el, (res: any) => {
          const r = res && res.size;
          if (r && r.width > 0 && r.height > 0) {
            collapsedLeftPx = Math.round(r.left);
            collapsedTopPx = Math.round(r.top);
            collapsedWidthPx = Math.round(r.width);
            collapsedHeightPx = Math.round(r.height);
          } else {
            fillCollapsedByEstimate();
          }
          cb();
        });
        return;
      }
    } catch (e) {
      console.error('measurePlaceholder error', e);
    }
    fillCollapsedByEstimate();
    cb();
    // #endif
  };

  // 创建常驻 webview,初始缩在占位 rect 上。
  const ensureWebview = () => {
    // #ifdef APP-PLUS
    if (disposed) return null; // 组件已卸载:拒绝创建(挂载 timer 竞态防护)
    if (inputWebview) return inputWebview;
    measurePlaceholder(() => {
      // 异步回调返回时组件可能已卸载(v-if 快速切换),双重检查防泄漏 webview。
      if (disposed || inputWebview) return;
      try {
        // 用 '_www/' 协议解析出绝对路径再创建 webview:
        // 直接传 '/uni_modules/...' 相对路径时,部分运行时基座对非 /static 约定路径
        // 的解析不一致(表现为 webview 加载 404、editor 不存在,点击输入框无反应)。
        // convertLocalFileSystemURL 返回【不带 scheme 的裸绝对路径】:Android WebView
        // 容忍裸路径,但 iOS WKWebView 需要完整 URL——统一补 file:// 前缀(双端标准)。
        // 解析失败时兜底用原相对路径。
        let h5LoadUrl: string = H5_URL;
        try {
          const abs = (plus as any).io?.convertLocalFileSystemURL?.('_www' + H5_URL);
          if (abs) {
            h5LoadUrl = /^file:/.test(abs) ? abs : ('file://' + abs);
          }
        } catch (e) { /* ignore: 兜底用原路径 */ }
        inputWebview = plus.webview.create(h5LoadUrl, WEBVIEW_ID, {
          top: collapsedTopPx + 'px',
          left: collapsedLeftPx + 'px',
          width: collapsedWidthPx + 'px',
          height: collapsedHeightPx + 'px',
          background: 'transparent',
          backgroundColor: 'transparent',
          scalable: false,
          // 【softinputMode 双端统一 adjustPan】消息列表已改 top 定位(不受键盘顶起
          // 视口影响),安卓不再需要 adjustResize 防闪动。改回 adjustPan 与 iOS 完全
          // 对齐:键盘弹起系统平移页面、webview 高度【不压缩】,slot 恒定 = kbFull、
          // 白底常驻铺满,切换/关闭真空期不会因 resize 扣除导致 slot 缩小、露出下层
          // 穿透黑(安卓"整块 slot 区域黑闪"的根因就是 resize 扣除让 slot 高度剧烈变)。
          // 注:曾试 adjustNothing 消除"键盘↔表情切换偶现黑闪",但它引入了收起悬停 +
          // 进键盘态顶部白条(同为 webview 改尺寸/relayout 的 surface paint gap,体验更差),
          // 且原黑闪概率低,综合取舍后维持 adjustPan。
          softinputMode: 'adjustPan',
        });
        bindWebviewEvents();
        inputWebview.show();
        // 注入平台标志给 H5:iOS 与 Android 键盘行为不同(iOS 全屏 webview 键盘会自动
        // 顶起 fixed 元素，不能再用注入高度二次补偿），H5 据此走不同的定位分支。
        try {
          const plat = (uni.getSystemInfoSync().platform || '').toLowerCase();
          inputWebview.evalJS('window.__setPlatform && window.__setPlatform("' + plat + '");');
        } catch (err) { /* ignore */ }
        // 创建完成后补同步一次禁言状态:进房时若已被禁言,上面的 immediate 监听
        // 执行时 inputWebview 还不存在,同步被跳过,这里补上。
        // 关键:此刻 H5 极可能【尚未加载完】,evalJS 静默失败 → 禁言态没同步到 H5、
        // editor 仍 contenteditable=true → 点输入框触发 focus/expand → 白框(再进房复现根因)。
        // 故【延时多次重试】补同步,覆盖 H5 加载完成的时间窗,确保禁言态最终一定落到 H5。
        syncBannedToH5();
        [300, 800, 1500].forEach((delay) => {
          setTimeout(() => { if (!disposed && inputWebview) syncBannedToH5(); }, delay);
        });
      } catch (e) {
        console.error('create input webview error', e);
        inputWebview = null;
      }
    });
    return inputWebview;
    // #endif
    // #ifndef APP-PLUS
    return null;
    // #endif
  };

  // 在常驻 webview 上绑定 titleUpdate 桥接事件。
  const bindWebviewEvents = () => {
    // #ifdef APP-PLUS
    if (!inputWebview) return;
    try {
      inputWebview.addEventListener('titleUpdate', (e: any) => {
        const title: string = (e && e.title) || '';
        if (title.indexOf('barrage:') !== 0) return;
        const rest = title.slice('barrage:'.length);
        const firstColon = rest.indexOf(':');
        const type = firstColon >= 0 ? rest.slice(0, firstColon) : rest;
        const afterType = firstColon >= 0 ? rest.slice(firstColon + 1) : '';
        const secondColon = afterType.indexOf(':');
        const encodedPayload = secondColon >= 0 ? afterType.slice(secondColon + 1) : '';
        let payload = '';
        try {
          payload = decodeURIComponent(encodedPayload || '');
        } catch (err) {
          payload = encodedPayload || '';
        }
        handleH5Signal(type, payload);
      });
    } catch (e) {
      console.error('bindWebviewEvents error', e);
    }
    // #endif
  };

  // H5 经 title 桥接发来的信号。
  const handleH5Signal = (type: string, payload: string) => {
    if (type === 'expand') {
      // 用户点了 H5 输入栏 → 键盘即将弹起,扩到全屏。
      expandWebview();
    } else if (type === 'send') {
      onH5Send(payload || '');
      collapseWebview();
    } else if (type === 'close') {
      collapseWebview();
    } else if (type === 'toast') {
      // 键盘输入超限等提示:转发给宿主页面,用原生 LiveToast 统一展示(风格一致)。
      try { uni.$emit('barrageInput:toast', payload || ''); } catch (e) { /* ignore */ }
    } else if (type === 'shift') {
      // iOS 专用：H5 用 visualViewport 反推出真实键盘高度后下发，驱动主页消息列表上移。
      // iOS WKWebView 不顶 nvue 主页,#bar 与消息列表让位都靠 H5 自身(shift 信号)驱动。
      const h = Math.max(0, Math.round(Number(payload) || 0));
      if (h > 0) lastKbHeight = h;
      emitHostShift(h > 0 ? h : lastKbHeight, 'signal:shift');
    } else if (type === 'panel') {
      // 切表情态。安卓:让位由 injectKbHeight(top 定位,与键盘态同值)接管,此处记录态即可;
      // iOS:injectKbHeight 不触发,靠此处直接 emit 全额(与键盘态 shift 同值 => 位置一致)。
      inPanelMode = true;
      const h = Math.max(0, Math.round(Number(payload) || 0));
      if (h > 0) lastKbHeight = h;
      emitHostShift(lastKbHeight, 'signal:panel');
    } else if (type === 'kb') {
      // 切键盘态。安卓:让位由 injectKbHeight 接管;iOS:靠此处直接 emit 全额。
      // 两态 emit 同值(lastKbHeight) => 消息列表 top 不变 => 切换零位移零闪动。
      inPanelMode = false;
      const h = Math.max(0, Math.round(Number(payload) || 0));
      if (h > 0) lastKbHeight = h;
      emitHostShift(lastKbHeight, 'signal:kb');
    }
  };

  const onH5Send = (raw: string) => {
    if (!raw) return;
    if (isDisableSendMessage.value) {
      return; // 禁言：静默拦截发送（提示由宿主页面在状态变化时统一给出）
    }
    const textToSend = transformEmojiNameToKey(raw);
    sendTextMessage({
      liveID: uni?.$liveID,
      text: textToSend,
      success: () => {},
      fail: (code: any, msg: any) => { console.error(`sendTextMessage failed, code: ${code}, msg: ${msg}`); },
    });
  };

  // 收起态可见的是下层 nvue 胶囊；透明 webview 只覆盖在其上接管点击。nvue 弹层
  // (退出/连麦 ActionSheet、drawer 等) 打开时，下层 nvue 胶囊会被弹层正常盖住，
  // 但上层透明 webview 仍浮在最高层——虽然透明看不见，却会【拦截触摸】导致弹层
  // 对应区域点不动。因此弹层打开时把透明 webview 移出屏幕(top 挪到可视区外)，
  // 让触摸落到弹层上；关闭后移回。
  //
  // 关键优势：webview 是【透明】的，移进/移出屏幕【没有任何视觉变化】——不像之前
  // hide/show 会有“drawer 过渡中穿透露出输入框”的问题。因此这里【不需要】猜动画
  // 时长做延迟，进出都可立即执行，稳定可靠。
  const setWebviewHidden = (hidden: boolean) => {
    // #ifdef APP-PLUS
    // 键盘/表情展开态(webview 全屏)不处理:此刻本就没有胶囊位可透传;收起时
    // collapseWebview 会按 hiddenByOverlay 决定落点,不依赖此处补发。
    if (!inputWebview || expanded) return;
    if (hidden) {
      // 隐藏【立即】执行,并取消尚未生效的恢复(恢复只延迟、隐藏不延迟)。
      if (webviewRestoreTimer != null) { clearTimeout(webviewRestoreTimer); webviewRestoreTimer = null; }
      if (webviewHiddenApplied) return; // 已在屏幕外,跳过重复 setStyle
      webviewHiddenApplied = true;
      try {
        inputWebview.setStyle({ top: offscreenTopPx() + 'px' });
      } catch (e) {
        console.error('setWebviewHidden error', e);
      }
    } else {
      // 恢复【延迟 400ms】再执行,延迟值须 ≥ 所有 drawer 的关闭动画时长(BaseDrawer 320ms、
      // CoGuestRequestPanel detail 层 340ms):父页面 modelValue 在关闭动画【开始】时就变
      // false,若 webview 提前回到胶囊位,动画滑出期间(如 120~320ms 区间)点胶囊区域会
      // 穿透到 H5 editor 错误弹起键盘。400ms 同时吸收宿主聚合状态「同帧/相邻帧短暂误判
      // 为无弹层」的抖动——典型如观众列表:二级面板打开(overlayActiveChange 异步 watch
      // 上抛)与一级列表关闭(v-model 同步下发)同帧发生,父页面先算 false(下发恢复)再算
      // true(下发隐藏);延迟期间若再次收到隐藏要求,恢复被取消,webview 全程未回屏幕。
      // 400ms 远小于人手关闭面板后再点输入框的间隔,正常恢复无感知。
      if (!webviewHiddenApplied) return; // 本就在胶囊位,无需恢复
      if (webviewRestoreTimer != null) return; // 已有 pending 恢复
      webviewRestoreTimer = setTimeout(() => {
        webviewRestoreTimer = null;
        // 复核:延迟期间若又要求隐藏或已展开,放弃恢复。
        if (!hiddenByOverlay && !expanded) {
          webviewHiddenApplied = false;
          try {
            inputWebview.setStyle({ top: collapsedTopPx + 'px' });
          } catch (e) {
            console.error('setWebviewHidden error', e);
          }
        }
      }, 400);
    }
    // #endif
  };
  const onSetHidden = (hidden: boolean) => {
    hiddenByOverlay = !!hidden;
    setWebviewHidden(!!hidden);
  };

  onMounted(() => {
    // #ifdef APP-PLUS
    // 兜底回收同 ID 遗留 webview:旧版本存在卸载竞态泄漏(挂载 timer 在卸载后
    // 触发创建、无人管理),或异常路径未 close。直播页同一时刻只有一个本组件
    // 实例,按 ID 回收安全;正常路径旧 webview 已 close,get 不到、无副作用。
    try {
      const legacy = plus.webview.getWebviewById(WEBVIEW_ID);
      if (legacy) { legacy.close(); }
    } catch (e) { /* ignore */ }
    mountTimer = setTimeout(() => { mountTimer = null; ensureWebview(); }, 300);
    uni.$on('barrageInput:setHidden', onSetHidden);
    // #endif
  });
  onUnmounted(() => {
    // #ifdef APP-PLUS
    disposed = true; // 拦截挂载 timer / 异步回调在此之后创建 webview
    if (mountTimer) { clearTimeout(mountTimer); mountTimer = null; }
    if (webviewRestoreTimer != null) { clearTimeout(webviewRestoreTimer); webviewRestoreTimer = null; }
    try {
      // 键盘态下页面被卸载(直播解散/被踢 redirectTo、连麦控制条 v-if 卸载等)时,
      // 直接 close() 焦点所在的 webview,系统 IME 不一定随之收起(安卓部分 ROM
      // 会僵在屏幕上:页面已回列表,键盘仍挂着)。先主动收键盘,再销毁 webview。
      // 无键盘时 hideKeyboard 是 no-op,故无条件调用最稳。
      try { uni.hideKeyboard(); } catch (e) { /* ignore */ }
      uni.offKeyboardHeightChange(onKbHeightChange);
      uni.$off('barrageInput:setHidden', onSetHidden);
      // 先发复位信号,再销毁 webview:退房/跳转时先让宿主恢复底部操作栏与消息列表
      // 位置,避免跳到列表页后宿主状态残留(操作栏消失/列表卡在键盘态)。
      uni.$emit('barrageInput:hide');
      emitHostShift(0, 'unmount');
      if (inputWebview) {
        inputWebview.close();
        inputWebview = null;
      }
      // 【兜底:按 ID 强制回收残留 webview】修复"偶现退出直播后 H5 输入框残留在
      // 直播列表页、导致列表页无法操作":
      // 本组件的 webview 是 plus.webview.create 创建的【独立原生窗口】,不属于
      // uni-app 页面栈、层级高于所有页面。只要它没被 close,就会浮在列表页之上
      // 拦截触摸。而上面 close 依赖局部变量 inputWebview 非空——若该变量因竞态
      // 为 null(异步创建回调未赋值/已被置空),webview 就会泄漏。故卸载时无条件
      // 按 WEBVIEW_ID 再回收一次:get 不到则无副作用,get 到则兜底关闭残留窗口。
      try {
        const leftover = plus.webview.getWebviewById(WEBVIEW_ID);
        if (leftover) leftover.close();
      } catch (e) { /* ignore */ }
      // 卸载即复位宿主侧「输入激活/让位」状态。典型场景:连麦控制条展开时
      // v-if 卸载本组件——若此前键盘/表情处于展开态(expanded),正常收起流程
      // (collapseWebview 发 hide + shift 0)不会执行,宿主的 isBarrageInputActive
      // 残留 true → 底部操作栏 opacity 0 永不出现;barrageInputShift 残留 →
      // 消息列表卡在键盘态位置。故卸载时统一补发复位信号。
      uni.$emit('barrageInput:hide');
      emitHostShift(0, 'unmount');
    } catch (e) {
      console.error('close input webview error', e);
    }
    // #endif
  });

  watch(messageBannedUserList, (newValue: any[]) => {
    // 【电平同步·非边沿触发】直接按"当前是否在禁言列表里"设值,不再用
    // isBanned&&!wasBanned 的跳变沿判定。跳变沿写法在【重新进房】时不可靠:
    // messageBannedUserList 初始为空、进房后才异步拉回,且 deep watch 可能在
    // isBanned 与 wasBanned 同为 true 时触发(两个 if 都不进),导致 isDisableSendMessage
    // 停在错误值 false → expandWebview 的禁言拦截失效 → 点输入框照常展开露出白底输入栏
    // (禁言用户"点击输入框变白"的根因)。改为电平同步后,任何触发时机都恒等于真实禁言态。
    const isBanned = (newValue || []).some((obj: any) => obj?.userID === uni.$userID);
    if (isDisableSendMessage.value !== isBanned) {
      isDisableSendMessage.value = isBanned;
      syncBannedToH5(); // 仅在禁言态真正变化时同步 H5,避免冗余 evalJS
      // 【键盘/表情展开态被禁言】H5 的 __setBanned→__abortExpand 只复位了 H5 视觉并收键盘,
      // 但【原生】侧 webview 仍是全屏展开态:会拦截所有触摸(弹幕/界面无法操作)、底部输入胶囊
      // 不再渲染、footer 与消息列表也没复位。必须主动调 collapseWebview 走完整收起流程
      // (缩回窄块 + 释放触摸 + emitHostShift(0) 消息列表下移 + barrageInput:hide 恢复 footer
      // + __exitActive 切收起态胶囊)。仅在被禁言且当前展开时执行。
      if (isBanned && expanded) {
        collapseWebview();
      }
    }
  }, { immediate: true, deep: true });
</script>

<style>
  /* 收起态可见的 nvue 胶囊：磨砂玻璃质感（半透明深底 + 细描边高光），
     透出下层直播画面。nvue 无 backdrop-filter，靠半透明底呈现玻璃感。
     注意：不要加 box-shadow —— nvue 上它会干扰 dom.getComponentRect 的 rect，
     导致覆盖其上的透明 webview 定位错位、点击唤不起键盘。
     其上覆盖透明 webview 接管点击；本胶囊仅负责视觉，故不绑点击。 */
  .barrage-input-root {
    width: 300rpx;
    height: 72rpx;
    border-radius: 36rpx;
    background-color: rgba(20, 20, 22, 0.54);
    border-width: 2rpx;
    border-color: rgba(255, 255, 255, 0.055);
    flex-direction: row;
    align-items: center;
    padding-left: 34rpx;
    padding-right: 34rpx;
    overflow: hidden;
  }
  .barrage-input-ph {
    font-size: 26rpx;
    color: rgba(235, 235, 245, 0.45);
    lines: 1;
    overflow: hidden;
  }
</style>
