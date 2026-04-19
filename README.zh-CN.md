<p align="center">
  <img width="300px" src="./src/assets/logo.svg">
</p>

# @antdv-next/x Playground

[English](./README.md)

基于 [@vue/repl](https://github.com/vuejs/repl) 的 [@antdv-next/x](https://www.npmjs.com/package/@antdv-next/x) 在线演练场。

## 使用

本地运行：

```bash
pnpm install
pnpm dev
```

## 注意事项

### Vue >= 3.5.0

Vue 版本选择器限制为 **>= 3.5.0**。

原因：`@antdv-next/x` 的 peer 依赖要求 Vue >= 3.5.0。

### antdv-next 运行时样式

`@antdv-next/x` 基于 `antdv-next` 构建，Playground 会继续加载 `antdv-next` 的 runtime/reset 样式以保证预览一致。

## 致谢

- [vuejs/repl](https://github.com/vuejs/repl)

## 许可证

[MIT](./LICENSE)
