# 简化的 AtomicX 主题系统

专为 NVue 在 App 端使用的简化主题系统。

## 特性

- 🎯 简单 Key 换肤
- 📱 仅支持 NVue 组件
- 🚀 轻量级实现
- 💾 自动持久化
- 🔄 实时主题切换

## 核心文件

- `theme.uts` - 主题系统核心
- `ThemeSwitcher.nvue` - 主题切换组件
- `ThemeDemo.nvue` - 主题演示页面

## 快速开始

### 1. 在 App.vue 中初始化

```ts
import { initTheme } from '@/uni_modules/tuikit-atomic-x/styles/theme.uts';

export default {
  onLaunch: function () {
    initTheme();
  }
}
```

### 2. 在 NVue 组件中使用

```vue
<template>
  <view class="container" :style="containerStyle">
    <text class="title" :style="titleStyle">标题</text>
    <view class="button" :style="buttonStyle" @click="handleClick">
      <text class="button-text" :style="buttonTextStyle">按钮</text>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { 
    getBackgroundColor,
    getTextColor,
    createButtonStyle 
  } from '../styles/theme.uts';
  
  const containerStyle = computed(() => getBackgroundColor());
  const titleStyle = computed(() => ({
    ...getTextColor(),
    fontSize: '18px',
    fontWeight: 'bold',
  }));
  const buttonStyle = computed(() => createButtonStyle('primary'));
  const buttonTextStyle = computed(() => getTextColor());
  
  const handleClick = () => {
    console.log('按钮点击');
  };
</script>
```

### 3. 切换主题

```ts
import { switchTheme } from '../styles/theme.uts';

switchTheme('blue');   // 切换到蓝色主题
switchTheme('pink');   // 切换到粉色主题
```

## 预设主题

| 主题键名 | 主题名称 | 主色调 |
|---------|---------|--------|
| default | 深色主题 | #2B6AD6 |
| light | 浅色主题 | #2B6AD6 |
| blue | 蓝色主题 | #007AFF |
| pink | 粉色主题 | #FF6B9D |
| green | 绿色主题 | #00C853 |

## API 参考

### 主题切换

```ts
// 切换主题
switchTheme(themeKey: string): void

// 获取当前主题
getCurrentTheme(): Theme

// 获取当前主题键名
getCurrentThemeKey(): string

// 获取所有主题
getThemes(): Record<string, Theme>
```

### 颜色获取

```ts
// 获取指定颜色
getColor(colorKey: string): string

// 获取背景色样式
getBackgroundColor(): UTSJSONObject

// 获取卡片背景色样式
getCardColor(): UTSJSONObject

// 获取文本颜色样式
getTextColor(): UTSJSONObject

// 获取次要文本颜色样式
getTextSecondaryColor(): UTSJSONObject
```

### 样式创建

```ts
// 创建按钮样式
createButtonStyle(type?: 'primary' | 'secondary' | 'outline'): UTSJSONObject

// 创建卡片样式
createCardStyle(): UTSJSONObject

// 创建列表项样式
createListItemStyle(): UTSJSONObject
```

## 主题监听

```ts
// 监听主题变化
uni.$on('theme-changed', (themeKey: string) => {
  console.log('主题已切换到:', themeKey);
});

// 取消监听
uni.$off('theme-changed');
```

## 最佳实践

1. **统一使用主题系统**：避免硬编码颜色值
2. **合理使用样式函数**：优先使用提供的样式创建函数
3. **响应式设计**：使用 computed 包装样式对象
4. **测试验证**：在不同主题下验证 UI 效果

## 常见问题

### Q: 如何添加新主题？

A: 在 `theme.uts` 中的 `themes` 对象添加新主题配置。

### Q: 如何自定义样式？

A: 使用基础样式函数，然后添加自定义属性：

```ts
const customStyle = computed(() => ({
  ...getBackgroundColor(),
  padding: '20px',
  margin: '10px',
}));
```

### Q: 主题切换不生效？

A: 确保在组件中使用 computed 包装样式对象。

## 示例

查看 `pages/ThemeDemo.nvue` 获取完整使用示例。