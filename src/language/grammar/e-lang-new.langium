grammar ELang

entry ELangProgram:
    (statements+=Statement (statements+=Statement)*)?
;

Statement:
    Expression
    | VariableDeclaration
    | DimensionDeclaration
    | UnitDeclaration
    | FormulaDeclaration
    | ConversionDeclaration
    | ModelDeclaration
    | StatementBlock
    | PrintStatement
    | IfStatement
    | MatchStatement
    | ForStatement
;

StatementBlock:
    '{' (statements+=Statement (statements+=Statement)*)? returnValue=ReturnStatement? '}'
;

ReturnStatement:
    'return' value=Expression
;

VariableDeclaration returns NamedElement:
    {infer ConstantDeclaration} (export?='export')? 'const' name=ID (':' type=TypeReference)? (assignment?='=' value=Expression)? |
    {infer MutableDeclaration} (export?='export')? 'var' name=ID (':' type=TypeReference)? (assignment?='=' value=Expression)?
;

ParameterDeclaration:
    name=ID (isOptional?='?')? ':' type=TypeReference
;

fragment ParameterBlock:
    '{'
        (properties+=ParameterDeclaration)*
    '}'
;

ModelDeclaration:
    (export?='export')? 'model' name=ID ('extends' parentTypes+=[ModelDeclaration:ID] (',' parentTypes+=[ModelDeclaration:ID])*)? ParameterBlock
;

FormulaDeclaration:
    (export?='export')? 'formula' name=ID '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' (':' returnType=TypeReference)? body=StatementBlock
;

DimensionDeclaration:
    (export?='export')? 'dimension' name=ID ('{' (units+=UnitDeclaration | conversions+=ConversionDeclaration)* '}')?
;

UnitDeclaration:
    'unit' name=ID (':' longName=ID)? description=STRING?
;

ConversionDeclaration:
    'conversion' from=[UnitDeclaration:ID] '->' to=[UnitDeclaration:ID] ':' (lambda=LambdaExpression | formula=[FormulaDeclaration:ID])
;

PrintStatement:
    'print' value=Expression
;

fragment ConditionAndBlock:
    '(' conditions+=Expression ')' blocks+=StatementBlock
;

IfStatement:
    'if' ConditionAndBlock
    ('else_if' ConditionAndBlock)*
    ('else' elseBlock=StatementBlock)?
;

MatchOption:
    condition=Expression '=>' (block=StatementBlock | value=Expression)
;

MatchStatement:
    'match' condition=Expression '{'
        (options+=MatchOption
        (options+=MatchOption)*)?
        ('default' '=>' (block=StatementBlock | value=Expression))?
    '}'
;

ForStatement:
    'for' '(' counter=VariableDeclaration 'from' from=Expression 'to' to=Expression ('step' step=Expression)? ')' block=StatementBlock
;

Expression:
    AssignmentExpression
;

AssignmentExpression infers Expression:
    LogicalOrExpression ({infer BinaryExpression.left=current} operator='=' right=LogicalOrExpression)*
;

LogicalOrExpression infers Expression:
    LogicalAndExpression ({infer BinaryExpression.left=current} operator='or' right=LogicalAndExpression)*
;

LogicalAndExpression infers Expression:
    ComparisonExpression ({infer BinaryExpression.left=current} operator='and' right=ComparisonExpression)*
;

ComparisonExpression infers Expression:
    AdditionExpression ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | 'equal' | '!=' | 'not_equal') right=AdditionExpression)*
;

AdditionExpression infers Expression:
    SubtractionExpression
    ({infer BinaryExpression.left=current} operator='+' right=SubtractionExpression)*
;

SubtractionExpression infers Expression:
    MultiplicationExpression
    ({infer BinaryExpression.left=current} operator='-' right=MultiplicationExpression)*
;

MultiplicationExpression infers Expression:
    DivisionExpression
    ({infer BinaryExpression.left=current} operator='*' right=DivisionExpression)*
;

DivisionExpression infers Expression:
    ExponentiationExpression
    ({infer BinaryExpression.left=current} operator='/' right=ExponentiationExpression)*
;

ExponentiationExpression infers Expression:
    UnaryPrefixExpression
    ({infer BinaryExpression.left=current} operator='^' right=UnaryPrefixExpression)*
;

UnaryPrefixExpression infers Expression:
    operator=('-' | '!' | 'not') value=UnaryPostfixExpression
    | UnaryPostfixExpression
;

UnaryPostfixExpression infers Expression:
    value=PrimitiveExpression operator=('++' | '--')
    | PrimitiveExpression
;

PrimitiveExpression infers Expression:
    '(' Expression ')'
    | ReferenceExpression
    | StringLiteral
    | NumberLiteral
    | BooleanLiteral
    | NullLiteral
    | MeasurementLiteral
    | ListExpression
    | LambdaExpression
;

ReferenceExpression:
    element=[NamedElement:ID]
;

StringLiteral:
    value=STRING
;

BooleanLiteral:
    value?='true' | 'false'
;

IntegerLiteral infers NumberLiteral:
    value=INT
;

DecimalLiteral infers NumberLiteral:
    value=DEC
;

NumberLiteral:
    IntegerLiteral
    | DecimalLiteral
;

NullLiteral:
    value='null'
;

MeasurementLiteral:
    value=NumberLiteral unit=[UnitDeclaration:ID]
;

ListExpression:
    '[' (elements+=Expression (',' elements+=Expression)*)? ']'
;

LambdaExpression:
    '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' (':' returnType=TypeReference)? '=>' body=(Expression | StatementBlock)
;

LambdaType:
    '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' '=>' returnType=TypeReference
;

TypeReference:
    TypeUnion
;

TypeUnion infers TypeReference:
    TypeIntersection ({infer TypeUnion.left=current} operator=('or') right=TypeIntersection)*;

TypeIntersection infers TypeReference:
    PrimaryTypeReference ({infer TypeIntersection.left=current} operator=('and') right=PrimaryTypeReference)*;


PrimaryTypeReference infers TypeReference:
    ('(' TypeReference ')'
    | primitive=('number' | 'text' | 'boolean')
    | dimension=[DimensionDeclaration:ID]
    | unit=[UnitDeclaration:ID]
    | model=[ModelDeclaration:ID]
    | LambdaType)
    (array?='list')?
;

type NamedElement = 
    ConstantDeclaration
    | MutableDeclaration
    | ParameterDeclaration
    | FormulaDeclaration
;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING returns string: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal DEC returns number: INT '.' INT;
terminal INT returns number: /[0-9]+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
