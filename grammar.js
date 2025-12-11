module.exports = grammar({
  name: "ferret",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.variable_declaration,
        $.function_declaration,
        $.type_declaration,
        $.return_statement,
        $.if_statement,
        $.while_statement,
        $.expression_statement,
      ),

    variable_declaration: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        choice(
          seq(":=", field("value", $._expression)),
          seq("=", field("value", $._expression)),
        ),
        ";",
      ),

    type_declaration: ($) =>
      seq(
        "type",
        field("name", $.type_identifier),
        "struct",
        field("body", $.struct_body),
        ";",
      ),

    struct_body: ($) => seq("{", repeat($.field_declaration), "}"),

    field_declaration: ($) =>
      seq(
        ".",
        field("name", $.field_identifier),
        ":",
        field("type", $.type),
        ",",
      ),

    function_declaration: ($) =>
      seq(
        "fn",
        optional($.method_receiver),
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $.return_type))),
        field("body", $.block),
      ),

    method_receiver: ($) =>
      seq(
        "(",
        field("name", $.identifier),
        ":",
        optional("&"),
        field("type", $.type),
        optional("?"),
        ")",
      ),

    parameter_list: ($) =>
      seq(
        "(",
        optional(
          seq($.parameter, repeat(seq(",", $.parameter)), optional(",")),
        ),
        ")",
      ),

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    return_type: ($) => choice($.type, seq($.type, "!", $.type)),

    block: ($) => seq("{", repeat($._statement), "}"),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        field("consequence", $.block),
        optional(seq("else", field("alternative", $.block))),
      ),

    while_statement: ($) =>
      seq("while", field("condition", $._expression), field("body", $.block)),

    return_statement: ($) =>
      seq("return", optional($._expression), optional("!"), ";"),

    expression_statement: ($) => seq($._expression, ";"),

    _expression: ($) =>
      choice(
        $.identifier,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.boolean_literal,
        $.binary_expression,
        $.unary_expression,
        $.call_expression,
        $.field_expression,
        $.catch_expression,
        $.parenthesized_expression,
        $.composite_literal,
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    binary_expression: ($) =>
      choice(
        prec.left(1, seq($._expression, "||", $._expression)),
        prec.left(2, seq($._expression, "&&", $._expression)),
        prec.left(3, seq($._expression, choice("==", "!="), $._expression)),
        prec.left(
          4,
          seq($._expression, choice("<", ">", "<=", ">="), $._expression),
        ),
        prec.left(5, seq($._expression, choice("+", "-"), $._expression)),
        prec.left(6, seq($._expression, choice("*", "/", "%"), $._expression)),
      ),

    unary_expression: ($) =>
      choice(
        prec.right(7, seq("!", $._expression)),
        prec.right(7, seq("-", $._expression)),
        prec.right(7, seq("&", $._expression)),
      ),

    call_expression: ($) =>
      prec(
        8,
        seq(
          field("function", $.identifier),
          field("arguments", $.argument_list),
        ),
      ),

    argument_list: ($) =>
      seq(
        "(",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(",")),
        ),
        ")",
      ),

    field_expression: ($) =>
      prec(
        9,
        seq(
          field("value", $._expression),
          ".",
          field("field", $.field_identifier),
        ),
      ),

    catch_expression: ($) =>
      seq(
        field("expression", $._expression),
        "catch",
        field("error_name", $.identifier),
        field("error_handler", $.block),
        optional("fallback"),
      ),

    // Composite literal can be either map or struct
    // Determined by first element: .field = value (struct) or key => value (map)
    composite_literal: ($) =>
      choice(
        // Empty literal {}
        seq("{", "}"),
        // Map literal: has =>
        seq(
          "{",
          $.map_entry,
          repeat(seq(",", $.map_entry)),
          optional(","),
          "}",
        ),
        // Struct literal: has . prefix
        seq(
          "{",
          $.struct_field_init,
          repeat(seq(",", $.struct_field_init)),
          optional(","),
          "}",
          optional(seq("as", $.type_identifier)),
        ),
      ),

    map_entry: ($) =>
      seq(field("key", $._expression), "=>", field("value", $._expression)),

    struct_field_init: ($) =>
      seq(
        ".",
        field("name", $.field_identifier),
        "=",
        field("value", $._expression),
      ),

    type: ($) =>
      choice(
        $.primitive_type,
        $.map_type,
        $.reference_type,
        $.optional_type,
        $.type_identifier,
      ),

    primitive_type: ($) =>
      choice("str", "byte", "bool", "i32", "i64", "f32", "f64"),

    map_type: ($) =>
      seq(
        "map",
        "[",
        field("key_type", $.type),
        "]",
        field("value_type", $.type),
      ),

    optional_type: ($) =>
      prec(
        1,
        seq(choice($.type_identifier, $.primitive_type, $.map_type), "?"),
      ),

    reference_type: ($) =>
      prec(
        2,
        seq(
          "&",
          choice(
            $.type_identifier,
            $.primitive_type,
            $.map_type,
            $.optional_type,
          ),
        ),
      ),

    // Literals
    integer_literal: ($) => /\d+/,

    float_literal: ($) => /\d+\.\d+/,

    string_literal: ($) =>
      seq('"', repeat(choice($.escape_sequence, /[^"\\]/)), '"'),

    char_literal: ($) => seq("'", choice($.escape_sequence, /[^'\\]/), "'"),

    escape_sequence: ($) =>
      token(
        seq("\\", choice(/[nrt'"\\]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/)),
      ),

    boolean_literal: ($) => choice("true", "false"),

    // Identifiers
    identifier: ($) => /[a-z_][a-zA-Z0-9_]*/,

    type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    field_identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Comments
    line_comment: ($) => token(seq("//", /.*/)),

    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});
