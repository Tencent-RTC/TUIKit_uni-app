import type { ITUIChatEngine } from './interface/engine';
import type { ITUIGlobal } from './interface/global';
import type { ITUIStore } from './interface/store';
import type {
  ITUIConversationService,
  ITUIUserService,
  ITUIChatService,
  ITUIGroupService,
  ITUIReportService,
} from './interface/service';
import ChatEngine from './TUIEngine/engine';
import TUIGlobal from './TUIGlobal/tui-global';
import TUIStore from './TUIStore/tui-store';
import TUIConversationService from './TUIConversationService/tui-conversation';
import TUIGroupService from './TUIGroupService/tui-group';
import TUIUserService from './TUIUserService/tui-user';
import TUIChatService from './TUIChatService/tui-chat';
import TUIReportService from './TUIReportService/tui-report';
import { MountedList, StoreName, ValidateAPIList } from './const';
import validateInitialization from './utils/validate-initialization';

const version = 'BUNDLE_VERSION';
console.log(`TUIChatEngine-Lite.VERSION:${version}`);

// 实例化
const TUIChatEngine: ITUIChatEngine = ChatEngine.getInstance();
const tuiGlobal: ITUIGlobal = TUIGlobal.getInstance();
const tuiStore: ITUIStore = TUIStore.getInstance();
const tuiConversation: ITUIConversationService = TUIConversationService.getInstance();
const tuiGroup: ITUIGroupService = TUIGroupService.getInstance();
const tuiUser: ITUIUserService = TUIUserService.getInstance();
const tuiChat: ITUIChatService = TUIChatService.getInstance();
const tuiReport: ITUIReportService = TUIReportService.getInstance();

// 模块挂载
TUIChatEngine.mount(MountedList.TUIStore, tuiStore);
TUIChatEngine.mount(MountedList.TUIConversation, tuiConversation);
TUIChatEngine.mount(MountedList.TUIUser, tuiUser);
TUIChatEngine.mount(MountedList.TUIChat, tuiChat);
TUIChatEngine.mount(MountedList.TUIReport, tuiReport);

// API 调用校验 Engine 初始化状态
validateInitialization(TUIChatEngine, TUIChatEngine, ValidateAPIList.ENGINE);
validateInitialization(TUIChatEngine, tuiConversation, ValidateAPIList.CONV);
validateInitialization(TUIChatEngine, tuiChat, ValidateAPIList.CHAT);
validateInitialization(TUIChatEngine, tuiUser, ValidateAPIList.USER);
validateInitialization(TUIChatEngine, tuiReport, ValidateAPIList.ENGINE);

// 输出 service 方法参数和 model 声明文件
export * from './type';
export * from './interface/model';

// 输出产物
export {
  TUIChatEngine,
  tuiGlobal as TUIGlobal,
  tuiStore as TUIStore,
  tuiConversation as TUIConversationService,
  tuiGroup as TUIGroupService,
  tuiUser as TUIUserService,
  tuiChat as TUIChatService,
  tuiReport as TUIReportService,
  StoreName,
};

export default TUIChatEngine;
