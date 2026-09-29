/**
 * 直播间关注关系本地缓存(真实关注 API 未接入前的本地存储)。
 *
 * 背景:关注交互先用本地态模拟。若只放组件 ref,重开面板即丢;模块级变量
 * 也不行——nvue 页面销毁时 JS 上下文随之销毁,退房再进房(新页面上下文)
 * 会重新加载模块、缓存清零。故落 uni storage:跨页面上下文/App 级可靠共享,
 * 退房再进、反复进出直播间状态不丢。
 *  - key 统一用被关注用户的 userID(主播也是用户):同一主播的不同直播间状态一致。
 *  - 接入真实关注 API 后本模块整体替换为云端读写,页面调用方代码不变。
 */

const STORAGE_KEY = 'atomicx_followed_users';

function loadSet(): Set<string> {
  try {
    const raw: any = uni.getStorageSync(STORAGE_KEY);
    if (raw) {
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(arr)) return new Set<string>(arr);
    }
  } catch (e) { /* ignore */ }
  return new Set<string>();
}

function persist(s: Set<string>): void {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(Array.from(s)));
  } catch (e) { /* ignore */ }
}

// 当前页面上下文的内存镜像(同页面内组件共享);跨上下文由 storage 保证。
let followedSet = loadSet();

export function isUserFollowed(userID: string | null | undefined): boolean {
  if (!userID) return false;
  return followedSet.has(userID);
}

export function setUserFollowed(userID: string | null | undefined, followed: boolean): void {
  if (!userID) return;
  if (followed) followedSet.add(userID);
  else followedSet.delete(userID);
  persist(followedSet);
}

/** 切换关注态并返回新状态(写入缓存)。 */
export function toggleUserFollowed(userID: string | null | undefined): boolean {
  if (!userID) return false;
  const next = !isUserFollowed(userID);
  setUserFollowed(userID, next);
  return next;
}
