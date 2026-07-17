<template>
  <image :style="[computedStyle]" :src="avatarSrc" @error="handleImageError" mode="aspectFill" />
</template>

<script lang="ts">
  // @ts-nocheck
  import defaultAvatarIcon from '../../assets/base/default-avatar.png'

  /**
   * Parse a CSS string like "position: absolute; width: 100px; height: 100px;"
   * into a style object { position: 'absolute', width: '100px', height: '100px' }.
   * In uni-app Vue2 mini-program builds, `:style` bound to a string variable via
   * an array (e.g. `:style="[styleVar]"`) does not render correctly, while an
   * object works. Chat components pass objects; CallView passes strings.
   * This normalizer ensures both formats render identically.
   */
  function parseCssString(css) {
    if (typeof css !== 'string') return css;
    const obj = {};
    css.split(';').forEach(decl => {
      const trimmed = decl.trim();
      if (!trimmed) return;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) return;
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      if (key && value) {
        // Convert kebab-case to camelCase for style object keys.
        obj[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      }
    });
    return obj;
  }

  export default {
    props: {
      src: {
        type: String,
        default: defaultAvatarIcon
      },
      avatarStyle: {
        type: [String, Object],
        default: () => ({})
      }
    },

    data() {
      return {
        avatarSrc: this.src || defaultAvatarIcon,
        computedStyle: typeof this.avatarStyle === 'string'
          ? parseCssString(this.avatarStyle)
          : this.avatarStyle,
      };
    },

    watch: {
      src: {
        handler(newVal) {
          this.avatarSrc = newVal;
        },
        immediate: true,
      },
      avatarStyle: {
        handler(newVal) {
          this.computedStyle = typeof newVal === 'string'
            ? parseCssString(newVal)
            : newVal;
        },
        immediate: true,
      }
    },

    methods: {
      handleImageError() {
        this.avatarSrc = defaultAvatarIcon;
      }
    }
  }
</script>

<style></style>