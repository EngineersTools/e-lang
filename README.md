# e-lang

![e-lang logo](/img/elang-social-card.png)

`e-lang` is an experimental programming language that provides higher level abstractions specific to the needs of engineering disciplines.

## Getting Started

The best way to try `e-lang` is to install the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=EngineersTools.e-lang). This includes an interpreter that runs e-lang notebook (\*.elnb) files (see the [examples](./examples/) folder).

### Installing CLI

`e-lang` includes a basic CLI tool. Currently the only implemented command is `run`, which interprets a program and returns any `print` statements to the console.

To install the CLI run:

```cmd
npm i -g @eng-tools/e-lang@latest
```

To run a file, type:

```cmd
elang run ./path/to/your/file.elng
```

This is an alpha version and it should not be used in production.

## Documentation

Documentation is being built on the GitHub repo whilst a documentation site is being prepared. Head to the [docs](./docs/) folder to read about the core concepts and features that comprise `e-lang`.

## Examples

The [examples](./examples/) folder contains e-lang notebooks with explanations and demonstrations of the various features of this language.
