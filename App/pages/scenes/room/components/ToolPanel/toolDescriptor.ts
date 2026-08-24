/**
* ToolDescriptor — 房间底部工具的统一描述符
*
* ToolPanel 通过 descriptor + `<component :is>` 模式渲染工具，
* 不再依赖 slot（slot 实际渲染数在运行时决定，prop 拿不到准确 count）。
*
* - main 维护 `toolsList: ToolDescriptor[]` computed
* - 每个 descriptor 可选填 `visible` 字段——false 表示该工具在「收起态」不展示
*   （常用于权限/角色控制的工具，如只有 Owner/Admin 才看得到录制按钮）。
*   缺省视为 true。**避免在 ToolPanel 里用 component 内部 v-if 反推**——
*   component 内部 v-if 是组件自己的实现细节，ToolPanel 不知道也不该知道。
* - visible=false 的工具仍会出现在「展开态」（展开面板是要看全部工具的入口，
*   不能因权限隐藏而让用户在展开态什么都看不到）。
* - ToolPanel 内部用"visible 工具数 vs threshold"自决是否显示「展开」按钮。
* - listener 通过 descriptor.listeners.{emitName} 字段暴露，ToolPanel 内部 hardcode 透传
*   （nvue 下 v-on 字符串形式最稳，对象形式 v-on="obj" 不一定支持）
*/

export type ToolListener = (payload?: any) => void;

export interface ToolListeners {
  click?: ToolListener;
  'request-start'?: ToolListener;
  'request-stop'?: ToolListener;
  [emitName: string]: ToolListener | undefined;
}

export interface ToolDescriptor {
  name: string;
  component: any;
  props?: Record<string, any>;
  listeners?: ToolListeners;
  /** 在「收起态」是否可见。缺省 true。常用于权限/角色控制的工具——false 时该工具
   *  不渲染、收起态的 threshold 计数也不计入，但「展开态」仍保留入口。 */
  visible?: boolean;
}
