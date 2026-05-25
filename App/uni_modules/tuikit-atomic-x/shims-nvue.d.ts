declare module '*.nvue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.uts' {
  export type HybridCallOptions = {
    api: string
    params: Record<string, any>
  }
  export type HybridListenerOptions = {
    type: string
    store: string
    name: string
    listenerID?: string
    params?: Record<string, any>
  }
  export type CallExperimentalAPIOptions = {
    jsonData: string
    onResponse?: (jsonData: string) => void
  }
  export type HybridResponseData<T = any> = {
    code: number
    message?: string
    data?: T
  }
}
