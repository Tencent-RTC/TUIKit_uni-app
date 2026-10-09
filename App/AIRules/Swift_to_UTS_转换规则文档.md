# Swift 到 UTS 转换规则文档

## 概述

本文档基于 `LoginState.swift`、`LoginStateEventObserver.swift` 和 UTS 封装层 `index.uts` 的实际转换实践，总结出系统性的 Swift 到 UTS 转换规则，用于指导 iOS 原生代码到 UniApp UTS 插件的迁移工作。

## 转换架构分析

### 整体架构对比

```mermaid
graph TD
    subgraph "Swift 原生架构"
        A1[LoginState.swift<br/>完整状态管理] 
        A2[LoginStateEventObserver.swift<br/>事件观察者]
        A3[@Published + Combine<br/>状态监听]
    end
    
    subgraph "UTS 封装架构"
        B1[LoginStateManager.uts<br/>UTS管理器封装]
        B2[集成事件监听<br/>私有方法]
        B3[uni.$emit<br/>事件分发]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    
    B1 --> C[UniApp 应用层]
    B3 --> C
```

### 架构层级对比

| 层级 | Swift 实现 | UTS 转换 | 主要变化 |
|------|------------|----------|----------|
| **状态管理层** | `LoginState.swift` | `LoginStateManager.uts` | 从完整实现转为封装调用 |
| **事件观察层** | `LoginStateEventObserver.swift` | 集成到管理器的私有方法 | 独立类转为集成方法 |
| **状态监听** | `@Published` + `Combine` | `uni.$emit` 事件分发 | 响应式转为事件驱动 |
| **回调机制** | `TUISuccessBlock` / `TUIErrorBlock` | Options 统一回调 | 类型化回调封装 |

## 核心转换规则

### 规则一：类结构转换

#### 单例模式转换

**Swift 原始模式：**
```swift
public class LoginState: NSObject, ObservableObject {
    public static let shared = LoginState()
    
    private override init() {
        super.init()
        addListener()
        bindData()
    }
}
```

**UTS 转换模式：**
```typescript
export class LoginStateManager {
    private loginState : LoginState

    constructor() {
        console.log(`${TAG} constructor.start`);
        this.loginState = LoginState.shared  // 直接引用 Swift 单例
        this.onLoginStatusChanged()          // 初始化事件监听
        this.onLoginUserInfoChanged()
    }
}
```

**转换要点：**
- ✅ Swift 单例通过 `LoginState.shared` 直接引用
- ✅ UTS 层不重新实现单例，而是封装原生单例
- ✅ 构造函数负责事件监听的初始化
- ✅ 移除 Swift 的继承结构，简化为封装模式

### 规则二：方法签名转换

#### 多参数方法转换

**Swift 原始方法：**
```swift
func login(sdkAppId: Int,
           userId: String,
           userSig: String,
           onSuccess: TUISuccessBlock? = nil,
           onError: TUIErrorBlock? = nil)
{
    loginInternal(sdkAppId: sdkAppId, userId: userId, userSig: userSig, 
                  onSuccess: onSuccess, onError: onError)
}
```

**UTS 转换方法：**
```typescript
public login(options : LoginOptions) {
    this.loginState.login(
        (sdkAppId = options.sdkAppID.toInt32()),
        (userId = options.userID),
        (userSig = options.userSig),
        (onSuccess = () : void => {
            console.log(`${TAG} login success`);
            options?.success?.();
        }),
        (onError = (errCode : Int32, errMsg ?: String) : void => {
            console.error(`${TAG} login fail, errCode = ${errCode}, errMsg = ${errMsg}`);
            options?.fail?.(errCode as number, errMsg as string);
        })
    )
}
```

**转换规则：**
- 📦 **参数封装**：多个独立参数 → 单一 `Options` 对象
- 🔄 **类型转换**：`Int` → `toInt32()` → `Int32`
- 📞 **回调统一**：Swift 的可选回调 → UTS 的 success/fail 模式
- 📝 **日志增强**：添加详细的操作日志

#### 接口定义规范

```typescript
// interface.uts - 正确的接口定义方式
export interface BaseOptions {
    success?: () => void;
    fail?: (errCode: number, errMsg: string) => void;
}

export interface LoginOptions extends BaseOptions {  // ✅ 使用 extends 继承
    sdkAppID: number;
    userID: string;
    userSig: string;
}

// ❌ 错误：UTS 不支持交叉类型
// export type LoginOptions = BaseOptions & { ... }
```

### 规则三：数据类型转换映射

| Swift 类型 | UTS 输入类型 | 转换方法 | UTS 输出类型 | 示例 |
|------------|--------------|----------|--------------|------|
| `Int` | `number` | `.toInt32()` | `Int32` | `options.sdkAppID.toInt32()` |
| `String` | `string` | 直接使用 | `String` | `options.userID` |
| `String?` | `string?` | 类型断言 | `String?` | `errMsg as string` |
| `Bool` | `boolean` | 直接使用 | `Bool` | `options.enabled` |
| `TUILoginUserInfo` | `TUILoginUserInfo` | 对象构造 | `TUILoginUserInfo` | `new TUILoginUserInfo()` |

#### 复杂对象转换示例

**Swift 对象设置：**
```swift
let userInfo = TUILoginUserInfo()
userInfo.userId = userId
userInfo.userName = userName
userInfo.avatarUrl = avatarUrl
```

**UTS 对象转换：**
```typescript
let selfInfo = TUILoginUserInfo()
selfInfo.userId = options?.userInfo?.userId;
selfInfo.userName = options?.userInfo?.userName;
selfInfo.avatarUrl = options?.userInfo?.avatarUrl;
```

### 规则四：状态监听转换

#### @Published 属性转换

**Swift 原始状态定义：**
```swift
// LoginState.swift
@Published public private(set) var loginUserInfo: TUILoginUserInfo?
@Published public private(set) var loginStatus: LoginStatus = .loggedOut
```

**Swift 事件观察：**
```swift
// LoginStateEventObserver.swift
private func observeLoginUserInfo() {
    LoginState.shared.$loginUserInfo
        .sink { [weak self] newInfo in
            self?.loginUserInfoChangedHandler?(newInfo)
        }
        .store(in: &cancellables)
}

private func observeLoginStatus() {
    LoginState.shared.$loginStatus
        .sink { [weak self] newStatus in
            self?.loginStatusChangedHandler?(newStatus)
        }
        .store(in: &cancellables)
}
```

**UTS 事件监听转换：**
```typescript
private onLoginUserInfoChanged() {
    LoginStateEventObserver.shared.loginUserInfoChangedHandler(function(newLoginUserInfo : any)  {
        uni.$emit('onLoginInfoChanged', JSON.stringify(newLoginUserInfo))
    }
}

private onLoginStatusChanged() {
    LoginStateEventObserver.shared.loginStatusChangedHandler(function (newLoginStatus : any) {
        uni.$emit('onLoginStatusChanged', JSON.stringify(newLoginStatus))
    }
}
```

**转换映射关系：**
```
Swift @Published 属性
    ↓
Swift $property.sink 监听
    ↓  
Swift Handler 函数调用
    ↓
UTS Handler 函数包装
    ↓
uni.$emit 事件分发
    ↓
UniApp 应用层接收
```

### 规则五：事件观察者转换

#### 观察者模式重构

**Swift 独立观察者：**
```swift
class LoginStateEventObserver {
    public static let shared = LoginStateEventObserver()
    private var cancellables = Set<AnyCancellable>()
    
    public var loginUserInfoChangedHandler: ((TUILoginUserInfo?) -> Void)?
    public var loginStatusChangedHandler: ((LoginStatus) -> Void)?
    
    private override init() {
        super.init()
        observeLoginUserInfo()
        observeLoginStatus()
    }
}
```

**UTS 集成模式：**
```typescript
export class LoginStateManager {
    constructor() {
        this.loginState = LoginState.shared
        // 直接在构造函数中初始化所有事件监听
        this.onLoginStatusChanged()
        this.onLoginUserInfoChanged()
    }

    // 集成为私有方法，而非独立类
    private onLoginUserInfoChanged() {
        LoginStateEventObserver.shared.loginUserInfoChangedHandler(function(newLoginUserInfo : any)  {
            uni.$emit('onLoginInfoChanged', JSON.stringify(newLoginUserInfo))
        }
    }
}
```

**转换策略：**
- 🔄 **架构简化**：独立观察者类 → 管理器内部的私有方法
- 🎯 **职责集中**：事件监听逻辑集中到管理器类中
- 📤 **统一分发**：所有事件通过 `uni.$emit` 统一分发
- 🏷️ **事件命名**：保持一致的事件命名规范

### 规则六：错误处理转换

#### 回调错误处理标准化

**Swift 错误处理：**
```swift
// 类型定义
typealias TUISuccessBlock = () -> Void
typealias TUIErrorBlock = (TUIError, String) -> Void

// 使用方式
onSuccess?()
onError?(error.code, error.message)
```

**UTS 错误处理：**
```typescript
// 统一的回调格式
(onSuccess = () : void => {
    console.log(`${TAG} operation success`);
    options?.success?.();
}),
(onError = (errCode : Int32, errMsg ?: String) : void => {
    console.error(`${TAG} operation fail, errCode = ${errCode}, errMsg = ${errMsg}`);
    options?.fail?.(errCode as number, errMsg as string);
})
```

**错误处理最佳实践：**
```typescript
// 1. 参数验证
if (!options || !options.userID) {
    console.error(`${TAG} invalid parameters`);
    options?.fail?.(-1, "Invalid parameters");
    return;
}

// 2. 类型转换检查
try {
    const sdkAppId = options.sdkAppID.toInt32();
} catch (error) {
    console.error(`${TAG} type conversion failed: ${error}`);
    options?.fail?.(-2, "Type conversion failed");
    return;
}

// 3. 异常捕获
try {
    this.loginState.login(/* parameters */);
} catch (error) {
    console.error(`${TAG} login exception: ${error}`);
    options?.fail?.(-3, `Login failed: ${error}`);
}
```

## 完整转换模板

### 基础管理器模板

```typescript
import { XxxOptions, XxxEventOptions } from '../interface.uts';
import { XxxStateEventObserver } from 'XxxStateEventObserver'
import { XxxState } from "NativeLibrary";
import { NativeType1, NativeType2 } from "NativeLibrary";

const TAG : String = "iOS-XxxStateManager"

export class XxxStateManager {
    private xxxState : XxxState

    constructor() {
        console.log(`${TAG} constructor.start`);
        this.xxxState = XxxState.shared
        this.initializeEventListeners()
    }

    // 主要业务方法转换模板
    public businessMethod(options : BusinessMethodOptions) {
        // 1. 参数验证
        if (!this.validateOptions(options, ['requiredField1', 'requiredField2'])) {
            return;
        }

        console.log(`${TAG} businessMethod.start, data: ${JSON.stringify(options)}`);

        // 2. 调用原生方法
        this.xxxState.businessMethod(
            (param1 = options.param1.toInt32()),
            (param2 = options.param2),
            (param3 = this.convertComplexObject(options.complexParam)),
            (onSuccess = () : void => {
                console.log(`${TAG} businessMethod success`);
                options?.success?.();
            }),
            (onError = (errCode : Int32, errMsg ?: String) : void => {
                console.error(`${TAG} businessMethod fail, errCode = ${errCode}, errMsg = ${errMsg}`);
                options?.fail?.(errCode as number, errMsg as string);
            })
        )
    }

    // 参数验证工具方法
    private validateOptions(options: any, requiredFields: string[]): boolean {
        if (!options) {
            console.error(`${TAG} options is null`);
            options?.fail?.(-1, "Options cannot be null");
            return false;
        }

        for (const field of requiredFields) {
            if (!options[field]) {
                console.error(`${TAG} ${field} is required`);
                options?.fail?.(-2, `${field} is required`);
                return false;
            }
        }
        return true;
    }

    // 复杂对象转换方法
    private convertComplexObject(input: any): NativeType1 {
        let nativeObj = new NativeType1();
        nativeObj.field1 = input?.field1;
        nativeObj.field2 = input?.field2;
        return nativeObj;
    }

    // 事件监听初始化
    private initializeEventListeners() {
        this.onStateChanged()
        this.onDataChanged()
        this.onErrorOccurred()
    }

    // 状态变化事件监听
    private onStateChanged() {
        XxxStateEventObserver.shared.stateChangedHandler(function(newState : any) {
            console.log(`${TAG} onStateChanged: ${JSON.stringify(newState)}`);
            uni.$emit('onXxxStateChanged', JSON.stringify(newState))
        })
    }

    // 数据变化事件监听
    private onDataChanged() {
        XxxStateEventObserver.shared.dataChangedHandler(function(newData : any) {
            console.log(`${TAG} onDataChanged: ${JSON.stringify(newData)}`);
            uni.$emit('onXxxDataChanged', JSON.stringify(newData))
        })
    }

    // 错误事件监听
    private onErrorOccurred() {
        XxxStateEventObserver.shared.errorHandler(function(error : any) {
            console.error(`${TAG} onError: ${JSON.stringify(error)}`);
            uni.$emit('onXxxError', JSON.stringify(error))
        })
    }
}
```

### 接口定义模板

```typescript
// interface.uts
export interface BaseOptions {
    success?: () => void;
    fail?: (errCode: number, errMsg: string) => void;
}

export interface BusinessMethodOptions extends BaseOptions {
    param1: number;              // 对应 Swift Int
    param2: string;              // 对应 Swift String
    complexParam?: ComplexType;   // 对应 Swift 自定义类型
}

export type ComplexType = {
    field1: string;
    field2: number;
    field3?: boolean;
}

// 事件数据类型定义
export type StateChangedEvent = {
    newState: string;
    timestamp: number;
}

export type DataChangedEvent = {
    newData: any[];
    changeType: 'ADD' | 'UPDATE' | 'DELETE';
}
```

## 转换工作流程

### Step 1: 分析 Swift 原始代码

1. **识别核心组件**
   - [ ] 主状态管理类（如 `LoginState`）
   - [ ] 事件观察者类（如 `LoginStateEventObserver`）
   - [ ] `@Published` 属性列表
   - [ ] 公开方法签名
   - [ ] 依赖的原生类型

2. **分析状态监听机制**
   - [ ] `@Published` 属性及其类型
   - [ ] `Combine` 监听逻辑
   - [ ] Handler 函数签名
   - [ ] 事件传递路径

3. **分析方法调用模式**
   - [ ] 参数类型和数量
   - [ ] 回调机制（Success/Error）
   - [ ] 异步操作模式
   - [ ] 返回值处理

### Step 2: 设计 UTS 封装架构

1. **创建管理器类结构**
   ```typescript
   export class XxxStateManager {
       // 1. 原生状态实例引用
       // 2. 构造函数事件监听初始化
       // 3. 业务方法封装
       // 4. 私有工具方法
       // 5. 事件监听方法
   }
   ```

2. **设计接口定义**
   ```typescript
   // 1. 基础 Options 接口
   // 2. 业务方法 Options 继承
   // 3. 复杂类型定义
   // 4. 事件数据类型定义
   ```

### Step 3: 实现方法转换

1. **方法签名转换**
   - 多参数 → Options 对象
   - 类型转换处理
   - 回调统一封装

2. **参数验证机制**
   - 空值检查
   - 必填字段验证
   - 类型转换验证

3. **错误处理统一**
   - try-catch 包装
   - 详细错误日志
   - 统一错误码

### Step 4: 实现事件监听转换

1. **事件监听集成**
   - 构造函数中初始化
   - 私有方法实现
   - uni.$emit 分发

2. **事件数据转换**
   - JSON 序列化
   - 数据格式标准化
   - 事件命名规范

### Step 5: 测试验证

1. **功能测试清单**
   - [ ] 所有业务方法正常调用
   - [ ] 参数验证生效
   - [ ] 回调机制正常
   - [ ] 状态监听正常
   - [ ] 事件分发正常
   - [ ] 错误处理正确

2. **兼容性测试**
   - [ ] iOS 设备兼容性
   - [ ] UniApp 框架兼容性
   - [ ] 数据类型兼容性

## 最佳实践指南

### 1. 代码组织原则

```typescript
// ✅ 好的做法
export class LoginStateManager {
    // 1. 常量定义
    private static readonly TAG = "iOS-LoginStateManager";
    
    // 2. 实例变量
    private loginState : LoginState;
    
    // 3. 构造函数
    constructor() { /* ... */ }
    
    // 4. 公开业务方法
    public login(options: LoginOptions) { /* ... */ }
    public logout(options: LogoutOptions) { /* ... */ }
    
    // 5. 私有工具方法  
    private validateOptions() { /* ... */ }
    private convertUserInfo() { /* ... */ }
    
    // 6. 事件监听方法
    private onLoginStatusChanged() { /* ... */ }
    private onLoginUserInfoChanged() { /* ... */ }
}
```

### 2. 命名规范

| 组件类型 | 命名模式 | 示例 |
|----------|----------|------|
| **管理器类** | `XxxStateManager` | `LoginStateManager` |
| **业务方法** | `camelCase` | `login`, `setSelfInfo` |
| **事件监听方法** | `onXxxChanged` | `onLoginStatusChanged` |
| **接口定义** | `XxxOptions` | `LoginOptions` |
| **常量定义** | `UPPER_CASE` | `TAG`, `DEFAULT_TIMEOUT` |

### 3. 日志规范

```typescript
// 日志级别规范
console.log(`${TAG} constructor.start`);                    // 信息日志
console.warn(`${TAG} deprecated method called`);            // 警告日志  
console.error(`${TAG} operation failed: ${error}`);         // 错误日志

// 日志内容规范
console.log(`${TAG} ${methodName}.start, data: ${JSON.stringify(options)}`);
console.log(`${TAG} ${methodName} success`);
console.error(`${TAG} ${methodName} fail, errCode = ${errCode}, errMsg = ${errMsg}`);
```

### 4. 错误处理规范

```typescript
// 1. 参数验证错误
if (!options) {
    options?.fail?.(-1, "Options cannot be null");
    return;
}

// 2. 类型转换错误
try {
    const value = options.numericValue.toInt32();
} catch (error) {
    options?.fail?.(-2, `Type conversion failed: ${error}`);
    return;
}

// 3. 业务逻辑错误
this.nativeState.operation(params, {
    onSuccess: () => options?.success?.(),
    onError: (code, message) => {
        console.error(`${TAG} business error: ${code}, ${message}`);
        options?.fail?.(code, message);
    }
});
```

## 常见问题与解决方案

### Q1: 类型转换失败

**问题：** `Cannot convert number to Int32`

**原因：** UTS 类型转换方法使用错误

**解决方案：**
```typescript
// ❌ 错误做法
this.nativeState.method(options.value);

// ✅ 正确做法  
this.nativeState.method(options.value.toInt32());
```

### Q2: 事件监听无响应

**问题：** Swift 状态变化后，UTS 层接收不到事件

**原因：** 事件观察者未正确初始化

**解决方案：**
```typescript
constructor() {
    this.xxxState = XxxState.shared;
    // 确保在构造函数中初始化所有事件监听
    this.onStatusChanged();
    this.onDataChanged();
}
```

### Q3: 回调函数不执行

**问题：** 原生方法调用成功，但 UTS 回调不触发

**原因：** 回调参数类型不匹配

**解决方案：**
```typescript
// ✅ 确保回调函数签名匹配
(onSuccess = () : void => {
    options?.success?.();
}),
(onError = (errCode : Int32, errMsg ?: String) : void => {
    options?.fail?.(errCode as number, errMsg as string);
})
```

### Q4: 复杂对象传递失败

**问题：** 复杂对象参数传递到原生层时数据丢失

**原因：** 对象转换不完整

**解决方案：**
```typescript
private convertUserInfo(userInfo: any): TUILoginUserInfo {
    let nativeUserInfo = new TUILoginUserInfo();
    // 确保转换所有必要字段
    nativeUserInfo.userId = userInfo?.userId || "";
    nativeUserInfo.userName = userInfo?.userName || "";
    nativeUserInfo.avatarUrl = userInfo?.avatarUrl || "";
    return nativeUserInfo;
}
```

### Q5: UTS 编译错误

**问题：** `Intersection Type is not supported`

**原因：** 使用了 TypeScript 交叉类型

**解决方案：**
```typescript
// ❌ 错误做法
export type LoginOptions = BaseOptions & {
    userID: string;
}

// ✅ 正确做法
export interface LoginOptions extends BaseOptions {
    userID: string;
}
```

## 性能优化建议

### 1. 避免重复初始化

```typescript
// ✅ 好的做法 - 单例模式
export class LoginStateManager {
    private static instance: LoginStateManager;
    
    public static getInstance(): LoginStateManager {
        if (!LoginStateManager.instance) {
            LoginStateManager.instance = new LoginStateManager();
        }
        return LoginStateManager.instance;
    }
}
```

### 2. 优化事件监听

```typescript
// ✅ 集中管理事件监听
private initializeEventListeners() {
    // 只在需要时创建监听器
    if (this.needsStatusUpdates) {
        this.onStatusChanged();
    }
    if (this.needsDataUpdates) {
        this.onDataChanged();
    }
}
```

### 3. 减少 JSON 序列化开销

```typescript
// ✅ 缓存序列化结果
private cacheEventData = new Map<string, string>();

private emitEvent(eventName: string, data: any) {
    const cacheKey = `${eventName}_${JSON.stringify(data)}`;
    let serializedData = this.cacheEventData.get(cacheKey);
    
    if (!serializedData) {
        serializedData = JSON.stringify(data);
        this.cacheEventData.set(cacheKey, serializedData);
    }
    
    uni.$emit(eventName, serializedData);
}
```

## 总结

通过本文档总结的转换规则，可以系统化地将 Swift 原生代码转换为 UTS 封装层，实现：

- ✅ **架构一致性**：保持清晰的分层结构
- ✅ **类型安全**：完整的类型转换和验证
- ✅ **事件驱动**：可靠的状态监听机制  
- ✅ **错误处理**：统一的错误处理策略
- ✅ **可维护性**：规范的代码组织和命名
- ✅ **性能优化**：高效的数据传递和事件分发

这套转换规则已在 `LoginState` 的实际转换中验证有效，可直接应用于其他 Swift State 类的 UTS 转换工作，为 iOS 原生功能向 UniApp 平台的迁移提供标准化的实施方案。

**关键成功要素：**
1. 严格按照转换规则执行
2. 保持接口设计的一致性
3. 完善的错误处理和日志记录
4. 充分的功能测试验证
5. 持续的性能监控和优化 