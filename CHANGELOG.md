# Changelog

## 0.1.0 (2026-11-16)


### Features

* add help dialog with version and open source licenses ([#15](https://github.com/tasshi-me/icaroon/issues/15)) ([0518f98](https://github.com/tasshi-me/icaroon/commit/0518f98be6c58a63b82a19e26d2ec2cf3fe62344))
* add i18n support with auto-detection ([b4aeb61](https://github.com/tasshi-me/icaroon/commit/b4aeb6152bc12f526a648a897fb7b7a36b7de8db))
* allow excluding events from import in the preview ([#14](https://github.com/tasshi-me/icaroon/issues/14)) ([8fdedfa](https://github.com/tasshi-me/icaroon/commit/8fdedfa74c4ab84e658fe0cfb938bc8d103c5a13))
* implement iCaroon — Garoon ics import portlet ([ced5214](https://github.com/tasshi-me/icaroon/commit/ced5214a4526eeb4847c096820257a5c9e87b9b0))


### Bug Fixes

* **parser:** resolve time zones without VTIMEZONE and support start-only events ([#13](https://github.com/tasshi-me/icaroon/issues/13)) ([f5dde30](https://github.com/tasshi-me/icaroon/commit/f5dde30b3432fc0d3d13a1e89cc65020a23f0327))


### Code Refactoring

* migrate UI from imperative DOM to Preact ([6bd10dd](https://github.com/tasshi-me/icaroon/commit/6bd10dd077edc54bacf0ec436b93e0cbc7dc8a64))


### Build System

* add version and build time to portlet artifacts ([#9](https://github.com/tasshi-me/icaroon/issues/9)) ([61db1ff](https://github.com/tasshi-me/icaroon/commit/61db1ffd894238c3f722fd8f05002d99830f799a))
* pin Node.js 24 and pnpm 10 with mise ([#6](https://github.com/tasshi-me/icaroon/issues/6)) ([126e49c](https://github.com/tasshi-me/icaroon/commit/126e49cb6e68b85afc98b11aff713b2af3fc66f2))
* upgrade Node.js to 26 and GitHub Actions to latest majors ([#12](https://github.com/tasshi-me/icaroon/issues/12)) ([69ca6f0](https://github.com/tasshi-me/icaroon/commit/69ca6f00f13affb965cbe8d47b437894a65fddc2))


### Continuous Integration

* add lint, typecheck, and build workflow ([#4](https://github.com/tasshi-me/icaroon/issues/4)) ([413484d](https://github.com/tasshi-me/icaroon/commit/413484d2e0b533460765609a4ca75cb2dcc11a8b))
* add release-please with portlet artifacts attached to releases ([#10](https://github.com/tasshi-me/icaroon/issues/10)) ([f34c0c0](https://github.com/tasshi-me/icaroon/commit/f34c0c00a5cddc9336e3ae867edbdf8d60cfcb25))
