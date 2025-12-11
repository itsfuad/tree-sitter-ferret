# Tree-sitter Grammar for Ferret

Tree-sitter parser for the Ferret programming language.

## Installation

```bash
npm install -g tree-sitter-cli
```

## Usage

```bash
# Generate parser
tree-sitter generate

# Test parser
tree-sitter parse main.fer
```

## Features

Supports:
- Variable declarations (`:=`, `=`)
- Type annotations
- Struct definitions
- Functions and methods
- Error handling (`!`, `catch`, `fallback`)
- Composite literals (maps and structs)
- Optional and reference types (`?`, `&`)

## Publishing

This grammar is used by the [Zed extension for Ferret](https://github.com/itsfuad/zed-ferret).

## License

MIT
