TUIKit 标准版是基于 IM SDK 的一款 UI 组件库。本文介绍如何快速集成精简版 TUIKit 并实现核心功能。

### 步骤1：安装依赖
1. 下载组件。
``` bash
npm install
```

### 步骤2：填写鉴权信息
 修改 `./debug/GenerateTestUserSig-es.js` 文件 的 SDKAPPID 以及 SECRETKEY。

   <img src="https://qcloudimg.tencent-cloud.cn/image/document/fb139f2bc10b1ae71eb9c1a6b63265e3.png" width="400" />


###  步骤4：运行和测试
![](https://write-document-release-1258344699.cos.ap-guangzhou.tencentcos.cn/100027131298/85f89e3d8c8411f0814e525400bf7822.png)


### Debug 脚本的作用

出于体积和安全双重因素考虑，请在发布前删除项目目录下 `/TUIKit/debug` 文件夹。在开发阶段为了方便开发，项目提供生成本地 UserSig 的脚本文件存放于`TUIKit/debug`文件夹中，但这并不安全，该方法中 SECRETKEY 很容易被反编译逆向破解，一旦您的密钥泄露，攻击者就可以盗用您的腾讯云流量，因此**该方法仅适合本地跑通 Demo 和功能调试**。因此，请在项目发布前删除 Debug 脚本，使用后台生成 UserSig，具体原因和操作步骤请参考文档：[生成 UserSig](https://write.woa.com/document/107052240244191232)。

## 联系我们

如遇任何问题，可联系 [官网售后](https://cloud.tencent.com/act/event/connect-service#/) 反馈，享有专业工程师的支持，解决您的难题。