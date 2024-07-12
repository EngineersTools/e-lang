hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING returns string: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal NUM returns number: /[0-9]+(\.[0-9]*)?/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;