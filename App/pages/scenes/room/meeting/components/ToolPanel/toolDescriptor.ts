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
  visible?: boolean;
}
