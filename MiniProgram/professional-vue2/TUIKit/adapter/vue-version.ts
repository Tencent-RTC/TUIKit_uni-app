// Detect Vue version at build time via UniApp conditional compilation.
// Only one branch survives in the final bundle.
//
// @ts-nocheck — Rollup sees both assignments but the actual build only keeps one.

let vueVersion: number;

// #ifndef VUE3
vueVersion = 2;
// #endif

// #ifdef VUE3
vueVersion = 3;
// #endif

export { vueVersion };
