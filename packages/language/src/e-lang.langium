grammar ELang

entry ELangProgram:
    Domain?
    (imports+=Import*)?
    statements+=Statement*
;

Domain:
    'domain' name=ID
;

Import:
    'import' source=STRING
;

Statement:
    DimensionDeclaration
    | UnitDeclaration
    | VariableDeclaration
    | FormulaDeclaration
    | ModelDeclaration
    | StatementBlock
    | PrintStatement
    | IfStatement
    | MatchStatement
    | ForStatement
    | Expression
;

StatementBlock:
    '{' (statements+=Statement*)? returnValue=ReturnStatement? '}'
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
        (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)?
    '}'
;

ModelDeclaration infers TypeReference:
    {infer ModelDeclaration} (export?='export')? 'model' name=ID ('extends' parentTypes+=[ModelDeclaration:ID] (',' parentTypes+=[ModelDeclaration:ID])*)? ParameterBlock
;

FormulaDeclaration:
    (export?='export')? 'formula' name=ID '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' (':' returnType=TypeReference)? body=StatementBlock
;

DimensionDeclaration:
    (export?='export')? 'dimension' name=ID ( '=' expression=DimensionExpression )?
;

DimensionExpression:
    DimensionTerm ({infer DimensionOperation.left=current} operator=('*'|'/') right=DimensionTerm)*
;

DimensionTerm infers DimensionExpression:
    {infer DimensionReference} ref=[DimensionDeclaration:ID] ('^' power=INT)? |
    '(' DimensionExpression ')'
;

UnitDeclaration:
    (export?='export')? 'unit' name=ID 
    ( ':' dimension=[DimensionDeclaration:ID] )?   // For Base units (unit meter : Length)
    ( '=' expression=UnitExpression )?           // For Derived units (unit hertz = 1 / second)
;

UnitExpression:
    UnitTerm ({infer UnitOperation.left=current} operator=('*'|'/') right=UnitTerm)*
;

UnitTerm infers UnitExpression:
    {infer UnitReference} ref=[UnitDeclaration:ID] ('^' power=INT)? |
    '(' UnitExpression ')' |
    {infer UnitLiteral} (value=INT | value=DEC)
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
    PostUnaryExpression
    ({infer BinaryExpression.left=current} operator='^' right=PostUnaryExpression)*
;

PostUnaryExpression infers Expression:
    EvaluationExpression ({infer PostUnaryExpression.value=current} operator=('++' | '--'))*
;

EvaluationExpression infers Expression:
    ImaginaryExpression
    ( // These can chain: obj.member[index](arg)
        {infer MemberAccess.receiver=current} '.' member=[NamedElement:ID] |
        {infer IndexedAccess.receiver=current} '[' index=Expression ']' |
        {infer CallExpression.callee=current} '(' (arguments+=Expression (',' arguments+=Expression)*)? ')'
    )*
;

ImaginaryExpression infers Expression:
    NumericExpression ({infer ImaginaryNumber.value=current} 'im')?
;

NumericExpression infers Expression:
    PrimitiveExpression ({infer Measurement.value=current} '~' unit=[UnitDeclaration:ID])?
;

PrimitiveExpression infers Expression:
    '(' Expression ')'
    | PreUnaryExpression
    | ReferenceExpression
    | StringLiteral
    | NumberLiteral
    | BooleanLiteral
    | NullLiteral
    | ModelExpression
    | ListExpression
    | LambdaExpression
;

PreUnaryExpression:
    operator=('not' | '-') value=Expression
;

ReferenceExpression:
    element=[NamedElement:ID]
;

StringLiteral:
    value=STRING
;

BooleanLiteral:
    value?=('true' | 'false')
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

ModelMemberAssignment:
    property=ID ':' value=Expression
;

ModelExpression:
    '{'
        (members+=ModelMemberAssignment (',' members+=ModelMemberAssignment)*)?
    '}'
;

ListExpression:
    '[' (elements+=Expression (',' elements+=Expression)*)? ']'
;

LambdaExpression:
    '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' (':' returnType=TypeReference)? '=>' body=(Expression | StatementBlock)
;

LambdaType:
    '(' (parameters+=TypeReference (',' parameters+=TypeReference)*)? ')' '=>' returnType=TypeReference
;

TypeReference:
    TypeUnion
;

TypeUnion infers TypeReference:
    TypeIntersection ({infer TypeUnion.left=current} operator=('or') right=TypeIntersection)*;

TypeIntersection infers TypeReference:
    PrimaryTypeReference ({infer TypeIntersection.left=current} operator=('and') right=PrimaryTypeReference)*;

PrimaryTypeReference infers TypeReference:
    (
        '(' TypeReference ')'
        | primitive=('number' | 'text' | 'boolean')
        | reference=[NamedElement:ID]
        | LambdaType
    )
    (array?='list')?
;

type NamedElement =
    ConstantDeclaration
    | MutableDeclaration
    | ParameterDeclaration
    | FormulaDeclaration
    | ModelDeclaration
    | DimensionDeclaration
    | UnitDeclaration;

type ExportableElement =
    ConstantDeclaration
    | MutableDeclaration
    | FormulaDeclaration
    | TypeReference
    | ModelDeclaration
    | DimensionDeclaration
    | UnitDeclaration;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING returns string: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal DEC returns number: INT '.' INT;
terminal INT returns number: /[0-9]+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;