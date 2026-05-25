/* eslint-disable */
declare const uni: any;
declare const plus: any;

/**
 * 文件选择 Hook（Vue2/Vue3 兼容）
 *
 * 功能：
 * - Android：通过 plus.android Intent.ACTION_GET_CONTENT 调起系统文件选择器
 *   plus.android.runtimeMainActivity().startActivityForResult 不支持回调参数，
 *   必须覆盖 mainActivity.onActivityResult 接管返回数据
 *   ContentResolver/Cursor/InputStream 等 Java 实例方法必须用 plus.android.invoke 显式调用
 * - iOS：通过 plus.io.chooseFile 调起系统文件选择器（UIDocumentPickerViewController），
 *   再通过 plus.io.resolveLocalFileSystemURL 获取文件元信息（name / size）
 *
 * 使用方式（Vue2/Vue3 通用）：
 *   import { chooseFile } from '../../hooks/useFilePicker'
 *   chooseFile({
 *     success: ({ filePath, fileName, fileSize }) => { ... },
 *     fail: (err) => { ... }
 *   })
 *
 * 注意：
 * - Android 返回的 filePath 是 content:// URI，由 SDK 自行处理
 * - iOS 返回的 filePath 是 _doc/ 或绝对路径，已去除 file:/// 前缀
 * - 文件体积超过 100MB 时弹 toast 提示，不触发 success 也不触发 fail
 */

export interface FilePickerResult {
  /** Android: content:// URI；iOS: 本地路径（去除 file:/// 前缀） */
  filePath: string;
  /** 文件名（含扩展名） */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
}

export interface FilePickerOptions {
  /** 成功回调 */
  success: (result: FilePickerResult) => void;
  /** 失败回调（用户取消不会触发） */
  fail?: (err: any) => void;
}

const FILE_REQUEST_CODE = 1001;
/** 单个文件最大支持体积（100MB） */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * 校验文件大小是否超过 100MB 上限
 * 超限时弹 toast 并返回 true（调用方应中断流程）
 */
function isFileSizeExceeded(fileSize: number): boolean {
  if (fileSize > MAX_FILE_SIZE) {
    uni.showToast({
      title: '文件体积超过 100MB，无法发送',
      icon: 'none',
      duration: 2500,
    });
    return true;
  }
  return false;
}

/**
 * 移除 file:/// 前缀
 */
function removeUnusedResourcePrefix(path: string): string {
  if (!path) return path;
  if (path.startsWith('file:///')) return path.substring(7);
  if (path.startsWith('file://')) return path.substring(7);
  return path;
}

/**
 * Android 桥接类/对象预加载缓存
 *
 * plus.android 的所有跨桥调用都是同步阻塞的，首次打开文件管理器慢主要由这些操作累计造成：
 * 1. importClass × 5 类     ≈ 250-1000ms（首次每类 50-200ms）
 * 2. runtimeMainActivity()   ≈ 100-300ms
 * 3. 读取 Intent 静态常量字段 ≈ 50-150ms
 * 4. new Intent + setType + addCategory ≈ 100-200ms
 * 5. startActivityForResult  ≈ 50-100ms（剩余，无法消除）
 * 6. 系统 DocumentsUI 启动   ≈ 200-500ms（系统侧，App 无法消除）
 *
 * 这里把 1-3 全部提前预热并缓存到模块级变量；
 * 4 也提前 new 一个备用 Intent（只是构造对象，不会调起 Activity）；
 * 用户首次点"文件"时只剩 5 + 6，体感由 1.5s+ 降到 ~300ms。
 *
 * 注意：预热本身是同步阻塞的（~1s），需要调用方在合适的时机触发，
 *       避免阻塞关键渲染窗口（如 MessageList 首屏定位）
 */
let androidClassesPreloaded = false;
let cachedIntentClass: any = null;
let cachedMainActivity: any = null;
let cachedActionGetContent: string = '';
let cachedCategoryOpenable: string = '';

function preloadAndroidClasses(): void {
  if (androidClassesPreloaded) return;
  // #ifdef APP-PLUS
  try {
    if (typeof plus === 'undefined' || !plus.android) return;
    // iOS 基座上 plus.android 可能是占位对象，关键方法不存在，必须二次校验
    if (typeof plus.android.importClass !== 'function'
        || typeof plus.android.runtimeMainActivity !== 'function') {
      androidClassesPreloaded = true; // 标记已处理，避免后续重复进入
      return;
    }

    // 1. 类导入（首次最慢的部分）
    cachedIntentClass = plus.android.importClass('android.content.Intent');
    plus.android.importClass('android.content.ContentResolver');
    plus.android.importClass('android.database.Cursor');
    plus.android.importClass('android.net.Uri');
    plus.android.importClass('java.io.InputStream');

    // 2. mainActivity 句柄（首次跨桥也慢）
    try {
      cachedMainActivity = plus.android.runtimeMainActivity();
    } catch (e) {
      console.error('[useFilePicker] runtimeMainActivity failed:', e);
    }

    // 3. Intent 静态常量字段（避免每次都跨桥读）
    try {
      if (cachedIntentClass) {
        cachedActionGetContent = cachedIntentClass.ACTION_GET_CONTENT;
        cachedCategoryOpenable = cachedIntentClass.CATEGORY_OPENABLE;
      }
    } catch (e) {
      console.error('[useFilePicker] read Intent constants failed:', e);
    }

    // 4. 预构造一个 Intent 实例（触发 Java 类初始化，只是构造对象，不调起 Activity）
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _warmupIntent = new cachedIntentClass(cachedActionGetContent || 'android.intent.action.GET_CONTENT');
    } catch (e) { /* noop */ }

    // 5. 预热 ContentResolver（顺便触发 MediaProvider 进程初始化）
    try {
      if (cachedMainActivity) {
        plus.android.invoke(cachedMainActivity, 'getContentResolver');
      }
    } catch (e) { /* noop */ }

    androidClassesPreloaded = true;
  } catch (e) {
    console.error('[useFilePicker] preloadAndroidClasses failed:', e);
  }
  // #endif
}

// 注意：模块加载时不自动预热（预热是同步阻塞的，会影响 chat 页面首屏）
// 交由调用方（MessageInput）在合适的时机触发 prewarmFilePicker，
// 推荐在 messageList 首屏完成后延时调用

/**
 * Android 通过 plus.android Intent 调起文件选择器
 *
 * 性能注意：所有可缓存对象/类/常量都通过 preloadAndroidClasses 提前热好，
 * 此处仅做最少的同步跨桥：new Intent + setType + setCategory + startActivityForResult
 */
function chooseFileAndroid(options: FilePickerOptions): void {
  try {
    // 兜底：若 MessageInput 尚未预热或预热尚未完成，这里同步补做
    // 用户已点击"文件"，此时集中跨桥可接受（反正要等文件管理器弹出）
    preloadAndroidClasses();

    const main: any = cachedMainActivity || plus.android.runtimeMainActivity();
    const Intent: any = cachedIntentClass || plus.android.importClass('android.content.Intent');
    // 优先用缓存的常量字符串，避免每次跨桥读取静态字段
    const actionGetContent: string = cachedActionGetContent || Intent.ACTION_GET_CONTENT;
    const categoryOpenable: string = cachedCategoryOpenable || Intent.CATEGORY_OPENABLE;

    const intent: any = new Intent(actionGetContent);
    intent.setType('*/*');
    intent.addCategory(categoryOpenable);

    main.onActivityResult = (requestCode: number, resultCode: number, data: any) => {
      if (requestCode !== FILE_REQUEST_CODE) return;
      // RESULT_OK = -1, RESULT_CANCELED = 0
      if (resultCode !== -1 || !data) return;
      try {
        const uri: any = plus.android.invoke(data, 'getData');
        if (!uri) {
          options.fail && options.fail(new Error('未获取到文件 URI'));
          return;
        }

        let fileName = '';
        let fileSize = 0;
        try {
          const resolver: any = plus.android.invoke(main, 'getContentResolver');
          const cursor: any = plus.android.invoke(resolver, 'query', uri, null, null, null, null);
          if (cursor && plus.android.invoke(cursor, 'moveToFirst')) {
            const nameIndex: any = plus.android.invoke(cursor, 'getColumnIndex', '_display_name');
            const sizeIndex: any = plus.android.invoke(cursor, 'getColumnIndex', '_size');
            if (nameIndex >= 0) fileName = plus.android.invoke(cursor, 'getString', nameIndex) as any;
            if (sizeIndex >= 0) fileSize = plus.android.invoke(cursor, 'getLong', sizeIndex) as any;
            plus.android.invoke(cursor, 'close');
          }
        } catch (e) {
          console.error('[useFilePicker] query file metadata failed:', e);
        }

        const filePath = uri.toString();
        if (!fileName) {
          fileName = filePath.split('/').pop() || `file_${Date.now()}`;
        }

        // 文件大小超限直接拦截，不 success 也不 fail（由 toast 提示用户）
        if (isFileSizeExceeded(fileSize)) return;

        options.success({ filePath, fileName, fileSize });
      } catch (err) {
        console.error('[useFilePicker] onActivityResult error:', err);
        options.fail && options.fail(err);
      }
    };

    main.startActivityForResult(intent, FILE_REQUEST_CODE);
  } catch (err) {
    console.error('[useFilePicker] chooseFileAndroid error:', err);
    options.fail && options.fail(err);
  }
}

/**
 * 通过 plus.io.resolveLocalFileSystemURL 获取文件元信息（name / size）
 * 找不到时通过路径解析兜底
 */
function fetchFileMeta(
  filePath: string,
  done: (fileName: string, fileSize: number) => void,
): void {
  // @ts-ignore plus.io 类型定义不全
  const io = plus && plus.io;
  if (!io || !io.resolveLocalFileSystemURL) {
    const fallbackName = filePath.split('/').pop() || `file_${Date.now()}`;
    done(fallbackName, 0);
    return;
  }
  try {
    io.resolveLocalFileSystemURL(
      filePath,
      (entry: any) => {
        if (entry && typeof entry.file === 'function') {
          entry.file(
            (file: any) => {
              const name = (file && file.name) || entry.name || filePath.split('/').pop() || `file_${Date.now()}`;
              const size = (file && typeof file.size === 'number') ? file.size : 0;
              done(name, size);
            },
            (err: any) => {
              console.error('[useFilePicker] entry.file failed:', err);
              done(entry.name || filePath.split('/').pop() || `file_${Date.now()}`, 0);
            },
          );
        } else {
          const fallbackName = (entry && entry.name) || filePath.split('/').pop() || `file_${Date.now()}`;
          done(fallbackName, 0);
        }
      },
      (err: any) => {
        console.error('[useFilePicker] resolveLocalFileSystemURL failed:', err);
        const fallbackName = filePath.split('/').pop() || `file_${Date.now()}`;
        done(fallbackName, 0);
      },
    );
  } catch (e) {
    console.error('[useFilePicker] fetchFileMeta exception:', e);
    const fallbackName = filePath.split('/').pop() || `file_${Date.now()}`;
    done(fallbackName, 0);
  }
}

/**
 * iOS 通过 plus.io.chooseFile 调起 UIDocumentPickerViewController
 *
 * 注意：plus.io.chooseFile 是 H5+ 内部 API，文档未公开但 Android/iOS 双端均可用
 *       回调结果只含 files 路径数组，不含元信息，需 resolveLocalFileSystemURL 二次查询
 */
function chooseFileIOS(options: FilePickerOptions): void {
  // @ts-ignore plus.io.chooseFile 类型定义不全
  const chooseFn = plus && plus.io && (plus.io as any).chooseFile;
  if (typeof chooseFn !== 'function') {
    options.fail && options.fail(new Error('plus.io.chooseFile not available'));
    return;
  }
  try {
    chooseFn.call(plus.io, {
      title: '选择文件',
      multiple: false,
    }, (e: any) => {
      const files: string[] = (e && e.files) || [];
      if (!files || files.length === 0) {
        // 用户取消或未选择，按"无错误"处理（与 Android 取消行为一致）
        return;
      }
      const rawPath = files[0];
      const filePath = removeUnusedResourcePrefix(rawPath);
      // 用 resolveLocalFileSystemURL 拉取真实文件名和大小
      fetchFileMeta(rawPath, (fileName: string, fileSize: number) => {
        // 文件大小超限直接拦截，不 success 也不 fail（由 toast 提示用户）
        if (isFileSizeExceeded(fileSize)) return;
        options.success({ filePath, fileName, fileSize });
      });
    }, (err: any) => {
      // iOS 用户取消可能走 fail 回调（不同基座行为不一致），统一识别为静默取消：
      // - PLUS_ERROR_USER_CANCELED = 12（H5+ 标准）
      // - 部分基座返回 -1 / 5 / 3 / 0 / null
      // - errMsg 可能含 "cancel" / "用户取消" / "取消" / "user canceled"
      // 为避免误把取消当失败弹 toast，将"无明确错误信息"的回调一律视作取消
      const code = err && err.code;
      const msg = String((err && (err.message || err.errMsg)) || '').toLowerCase();
      const isCancel =
        !err ||
        code === 12 ||
        code === -1 ||
        code === 5 ||
        code === 3 ||
        code === 0 ||
        msg.indexOf('cancel') >= 0 ||
        msg.indexOf('取消') >= 0 ||
        msg === '';
      if (isCancel) {
        return;
      }
      console.error('[useFilePicker] iOS chooseFile failed:', err);
      options.fail && options.fail(err);
    });
  } catch (e) {
    console.error('[useFilePicker] chooseFileIOS exception:', e);
    options.fail && options.fail(e);
  }
}

/**
 * 调起系统文件选择器（跨平台）
 * Android: plus.android Intent
 * iOS: plus.io.chooseFile + plus.io.resolveLocalFileSystemURL
 */
export function chooseFile(options: FilePickerOptions): void {
  // #ifdef APP-PLUS
  const platform = uni.getSystemInfoSync().platform;
  if (platform === 'android') {
    chooseFileAndroid(options);
  } else {
    chooseFileIOS(options);
  }
  // #endif

  // #ifndef APP-PLUS
  options.fail && options.fail(new Error('chooseFile only supports App platform'));
  // #endif
}

/**
 * 手动预热 Android 桥接类（同步阻塞 ~500-1000ms）
 * - 业务方应在关键渲染完成后（如 MessageList 首屏加载完后延时）调用
 * - 内部幂等：重复调用会直接 return
 * - iOS 无需预热，调用此函数也安全（noop）
 * - 推荐调用时机：onMounted 后 setTimeout 1000ms（错开 MessageList 150ms 首屏窗口）
 */
export function prewarmFilePicker(): void {
  preloadAndroidClasses();
}

/**
 * Hook 风格封装（与 useAudioPlayer 等保持一致的命名）
 */
export function useFilePicker() {
  return { chooseFile, prewarmFilePicker };
}
