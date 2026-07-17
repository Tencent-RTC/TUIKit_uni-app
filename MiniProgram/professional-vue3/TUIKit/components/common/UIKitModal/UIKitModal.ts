import type { UIKitModalOptions, UIKitModalResult } from './type';
import { TUICallKitServer } from '../../states/TUICallService/index';

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
const FULL_URL_REGEX = /(https?:\/\/[^\s]+)/g;

function isDevEnvironment(): boolean {
  const accountInfo = uni.getAccountInfoSync?.();
  const envVersion = accountInfo?.miniProgram?.envVersion;
  return envVersion === 'develop' || envVersion === 'trial';
}

function extractUrlFromContent(content: string): string | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  if (content.includes('<a ') || content.includes('<a>')) {
    const hrefMatch = content.match(/href=["']([^"']+)["']/);
    return hrefMatch ? hrefMatch[1] : null;
  }

  if (URL_REGEX.test(content.trim())) {
    return content.trim();
  }

  const urlMatch = content.match(FULL_URL_REGEX);
  return urlMatch ? urlMatch[0] : null;
}

function processContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let text = content.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  text = text.replace(/\s+/g, ' ').trim();

  const url = extractUrlFromContent(content);
  if (url && !text.includes(url)) {
    return text ? `${text}\n${url}` : url;
  }

  return text;
}

function reportModalView(options: UIKitModalOptions): void {
  try {
    const tim = TUICallKitServer?.getTim?.();
    if (tim && typeof tim.callExperimentalAPI === 'function') {
      const reportData = {
        id: options.id,
        title: options.title,
        type: options.type,
        content: options.content,
        platform: 'miniprogram',
      };
      tim.callExperimentalAPI('reportModalView', JSON.stringify(reportData));
    }
  } catch (error) {
    console.warn('[UIKitModal] reportModalView failed:', error);
  }
}

const createUIKitModal = (options: UIKitModalOptions): Promise<UIKitModalResult> => {
  return new Promise((resolve) => {
    reportModalView(options);

    if (!isDevEnvironment()) {
      resolve({ action: 'confirm' });
      return;
    }

    const url = extractUrlFromContent(options.content);
    const processedContent = processContent(options.content);
    const hasLink = !!url;

    uni.showModal({
      title: options.title || '',
      content: processedContent,
      cancelText: '取消',
      confirmText: hasLink ? '复制链接' : '确认',
      success: (res) => {
        const action = res.confirm ? 'confirm' : 'cancel';
        if (res.confirm) {
          if (hasLink && url) {
            uni.setClipboardData({
              data: url,
              success: () => {
                uni.showToast({ title: '链接已复制', icon: 'success' });
              },
            });
          }
          options.onConfirm?.();
        } else {
          options.onCancel?.();
        }
        resolve({ action, raw: res });
      },
      fail: () => {
        options.onCancel?.();
        resolve({ action: 'cancel' });
      },
    });
  });
};

export const UIKitModal = {
  openModal: (config: UIKitModalOptions) => createUIKitModal(config),
};
