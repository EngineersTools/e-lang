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
    | ForStatement
    | Expression
;

StatementBlock:
    '{' statements+=Statement* returnValue=ReturnStatement? '}'
;

ReturnStatement:
    'return' value=Expression
;

VariableDeclaration returns NamedElement:
    {infer ConstantDeclaration} (export?='export')? 'const' name=FeatureName (':' type=TypeReference)? (assignment?='=' value=Expression)? |
    {infer MutableDeclaration} (export?='export')? 'var' name=FeatureName (':' type=TypeReference)? (assignment?='=' value=Expression)?
;

ParameterDeclaration:
    name=FeatureName (isOptional?='?')? ':' type=TypeReference
;

fragment ParameterBlock:
    '{'
        (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)?
    '}'
;

ModelDeclaration infers TypeReference:
    {infer ModelDeclaration} (export?='export')? 'model' name=FeatureName ('extends' parentTypes+=[ModelDeclaration:FeatureName] (',' parentTypes+=[ModelDeclaration:FeatureName])*)? ParameterBlock
;

FormulaDeclaration:
    (export?='export')? 'formula' name=FeatureName '(' (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? ')' (':' returnType=TypeReference)? body=StatementBlock
;

DimensionDeclaration:
    (export?='export')? 'dimension' name=FeatureName ( '=' expression=DimensionExpression )?
;

DimensionExpression:
    DimensionTerm ({infer DimensionOperation.left=current} operator=('*'|'/') right=DimensionTerm)*
;

DimensionTerm infers DimensionExpression:
    {infer DimensionReference} ref=[DimensionDeclaration:FeatureName] ('^' power=INT)? |
    '(' DimensionExpression ')' |
    {infer DimensionLiteral} (value=INT | value=DEC)
;

UnitDeclaration:
    (export?='export')? 'unit' name=FeatureName 
    ( ':' dimension=[DimensionDeclaration:FeatureName] )?   // For Base units (unit meter : Length)
    ( '=' expression=UnitExpression )?           // For Derived units (unit hertz = 1 / second)
;

UnitExpression:
    UnitTerm ({infer UnitOperation.left=current} operator=('*'|'/') right=UnitTerm)*
;

UnitTerm infers UnitExpression:
    {infer UnitReference} ref=[UnitDeclaration:FeatureName] ('^' power=INT)? |
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
    condition=Expression '=>' action=Statement
;

MatchStatement infers Expression:
    {infer MatchStatement} 'match' condition=Expression '{'
        (options+=MatchOption
        (options+=MatchOption)*)?
        ('default' '=>' defaultAction=Statement)?
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
    UnitConversionExpression
    ({infer BinaryExpression.left=current} operator='^' right=UnitConversionExpression)*
;

UnitConversionExpression infers Expression:
    PostUnaryExpression
    ({infer BinaryExpression.left=current} operator='->' right=PostUnaryExpression)*
;

PostUnaryExpression infers Expression:
    EvaluationExpression ({infer PostUnaryExpression.value=current} operator=('++' | '--'))*
;

EvaluationExpression infers Expression:
    ImaginaryExpression
    ( // These can chain: obj.member[index](arg)
        {infer MemberAccess.receiver=current} '.' member=[NamedElement:FeatureName] |
        {infer IndexedAccess.receiver=current} '[' index=Expression ']' |
        {infer CallExpression.callee=current} '(' (arguments+=Expression (',' arguments+=Expression)*)? ')'
    )*
;

ImaginaryExpression infers Expression:
    NumericExpression ({infer ImaginaryNumber.value=current} 'im')?
;

NumericExpression infers Expression:
    PrimitiveExpression ({infer Measurement.value=current} '~' unit=[UnitDeclaration:FeatureName])?
;

PrimitiveExpression infers Expression:
    LambdaExpression
    | '(' Expression ')'
    | LogicalNotExpression
    | NegativeNumericExpression
    | BooleanLiteral
    | NullLiteral
    | ReferenceExpression
    | StringLiteral
    | NumberLiteral
    | ModelExpression
    | ListExpression
    | MatchStatement
;

LogicalNotExpression:
    'not' value=Expression
;

NegativeNumericExpression:
    '-' value=PostUnaryExpression
;

ReferenceExpression:
    element=[NamedElement:FeatureName]
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

ModelMemberAssignment returns NamedElement:
    {infer ModelMemberAssignment} name=FeatureName ':' value=Expression
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
        | primitive=('number' | 'text' | 'boolean' | 'null')
        | reference=[NamedElement:FeatureName]
        | LambdaType
    )
    (arrayDimensions+='list')*
;

type NamedElement =
    ConstantDeclaration
    | MutableDeclaration
    | ParameterDeclaration
    | FormulaDeclaration
    | ModelDeclaration
    | DimensionDeclaration
    | UnitDeclaration
    | ModelMemberAssignment;

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

FeatureName returns string:
    ID;

terminal STRING returns string: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal DEC returns number: INT '.' INT;
terminal INT returns number: /[0-9]+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;