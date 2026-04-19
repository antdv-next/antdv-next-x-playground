<p align="center">
  <img width="300px" src="./src/assets/logo.svg">
</p>

# @antdv-next/x Playground

[中文](./README.zh-CN.md)

Online playground for [@antdv-next/x](https://www.npmjs.com/package/@antdv-next/x), powered by [@vue/repl](https://github.com/vuejs/repl).

## Usage

Run locally:

```bash
pnpm install
pnpm dev
```

## Notes

### Vue >= 3.5.0

The Vue version selector is restricted to **>= 3.5.0**.

Reason: `@antdv-next/x` has a peer dependency on Vue >= 3.5.0.

### antdv-next runtime styles

`@antdv-next/x` is built on top of `antdv-next`, so the playground keeps loading `antdv-next` runtime/reset styles for preview rendering.

## Credits

- [vuejs/repl](https://github.com/vuejs/repl)

## License

[MIT](./LICENSE)
