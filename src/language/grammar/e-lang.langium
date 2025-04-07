grammar ELang

entry ELangProgram:
    (domain=Domain)?
    (imports+=Import (imports+=Import)*)?
    (statements+=Statement (statements+=Statement)*)?
;

/* 
    Defines the engineering domain to which
    this document applies. The domain acts effectively
    as a namespace for all the code defined in this document.
    One document can only have one domain definition.
    If multiple files define the same domain and the documents
    are imported, all their statements will be merged onto
    the same domain.
*/
Domain:
    'domain' name=ID
;

Import:
    'import' importSource=STRING
;

Statement:
    Expression |
    ForStatement |
    FormulaDeclaration |
    IfStatement |
    MatchStatement |
    ModelDeclaration |
    PrintStatement |
    ProcedureDeclaration |
    ReturnStatement |
    StatementBlock |
    UnitFamilyDeclaration |
    VariableDeclaration
;

VariableDeclaration returns NamedElement:
    {infer ConstantDeclaration} (export?='export')? 'const' name=ID (':' type=TypeReference)? (assignment?='=' value=Expression)? |
    {infer MutableDeclaration} (export?='export')? 'var' name=ID (':' type=TypeReference)? (assignment?='=' value=Expression)?
;

LambdaDeclaration infers Expression:
    {infer LambdaDeclaration}
    ParameterList
    (':' returnType=TypeReference)?
    '=>'
    body=(Expression | StatementBlock)
;

FormulaDeclaration:
    (export?='export')? 'formula' name=ID ParameterList 'returns' returnType=TypeReference body=StatementBlock
;

ProcedureDeclaration:
    (export?='export')? 'procedure' name=ID ParameterList ('returns' returnType=TypeReference)?
    body=StatementBlock
;

ParameterDeclaration:
    name=ID (isOptional?='?')? (':' type=TypeReference)?
;

fragment ParameterList:
    '(' 
        (parameters+=ParameterDeclaration (',' parameters+=ParameterDeclaration)*)? 
    ')'
;

StatementBlock:
    '{' 
        (statements+=Statement)* 
    '}'
;

ReturnStatement:
    'return' value=Expression
;

IfStatement:
    'if' '(' condition=Expression ')' block=StatementBlock
    ('else' elseBlock=StatementBlock)?
;

ForStatement:
    'for' '(' counter=VariableDeclaration 'from' from=Expression 'to' to=Expression ('step' step=Expression)? ')' block=StatementBlock
;

MatchStatement:
    'match' condition=Expression '{'
        options+=MatchOption
        (options+=MatchOption)*
        ('default' '=>' block=StatementBlock | value=Expression)?
    '}'
;

MatchOption:
    condition=Expression '=>' (block=StatementBlock | value=Expression)
;

PrintStatement:
    'print' value=Expression
;

type NamedElement = ConstantDeclaration | 
                    MutableDeclaration |
                    ModelDeclaration | 
                    PropertyDeclaration | 
                    FormulaDeclaration |
                    ProcedureDeclaration | 
                    ParameterDeclaration |
                    UnitFamilyDeclaration |
                    UnitDeclaration;

type Exportable = ConstantDeclaration | 
                    MutableDeclaration |
                    ModelDeclaration | 
                    FormulaDeclaration |
                    ProcedureDeclaration | 
                    UnitFamilyDeclaration;


Expression:
    Assignment
;

Assignment infers Expression:
    LogicalOr ({infer BinaryExpression.left=current} operator=('=') right=LogicalOr)* // Assignment has lowest precedence
;

LogicalOr infers Expression:
    LogicalAnd ({infer BinaryExpression.left=current} operator='or' right=LogicalAnd)*
;

LogicalAnd infers Expression:
    Comparison ({infer BinaryExpression.left=current} operator='and' right=Comparison)*
;

Comparison infers Expression:
    Addition ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Addition)*
;

Addition infers Expression:
    Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-') right=Multiplication)*
;

Multiplication infers Expression:
    Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/') right=Exponentiation)*
;

Exponentiation infers Expression:
    UnitConversion ({infer BinaryExpression.left=current} operator='^' right=UnitConversion)* // Changed base
;

// Renamed from UnitConversionExpression for clarity
UnitConversion infers Expression:
    UnaryExpression ({infer UnitConversion.value=current} operator='->' unit=[UnitDeclaration:ID])* // Simplified: applies to a value, no extra args
;


UnaryExpression infers Expression:
    operator=('!' | '-') value=PrefixExpression
;

// Unary operators
PrefixExpression infers Expression:
    UnaryExpression  | // Use PostfixExpression as operand
    PostfixExpression // Pass through if no prefix operator
;

// Handles calls, member access, indexed access
PostfixExpression infers Expression:
    PrimaryExpression
    ( // These can chain: obj.member[index](arg)
        {infer MemberAccess.receiver=current} '.' member=[NamedElement:ID] |
        {infer IndexedAccess.receiver=current} '[' index=Expression ']' |
        {infer CallExpression.callee=current} '(' (arguments+=Expression (',' arguments+=Expression)*)? ')'
    )*
;

PrimaryExpression infers Expression:
    '(' Expression ')' |
    StringLiteral |
    NumberLiteral |
    BooleanLiteral |
    NullLiteral |
    MeasurementLiteral |
    ModelValue |
    ListValue |
    ListCount |
    ListAdd |
    ListRemove |
    MathematicalFunction |
    ReferenceExpression |
    LambdaDeclaration 
;

ReferenceExpression infers Expression:
    element=[NamedElement:ID]
;

// FeatureCall infers Expression:
//     {infer ModelMemberCall}
//     element=[NamedElement:ID] | LambdaDeclaration
//     // Optional function call after referencing an element
//     (explicitOperationCall?='('
//         (
//             arguments+=Expression (',' arguments+=Expression)*
//         )?
//     ')')?
// ;

// ListAccess infers Expression:
//     {infer ModelMemberCall}
// 	element=[NamedElement:ID]
//     (accessElement?='[' 
//         (
//             index=(NUM | Expression)
//         ) 
//     ']')
// ;

// Most granular, low-level expressions
StringLiteral:
    value=STRING
;

NumberLiteral:
    value=NUM
;

BooleanLiteral:
    value?='true' | 'false'
;

NullLiteral:
    value='null'
;

MeasurementLiteral:
    value=NUM '_[' unit=[UnitDeclaration:ID] ']'
;

ModelValue:
    '{'
        (members+=ModelMemberAssignment (',' members+=ModelMemberAssignment)*)?
    '}'
;

ModelMemberAssignment:
    property=[PropertyDeclaration:ID] ':' value=Expression
;

ListValue:
    '['
        (items+=Expression (',' items+=Expression)*)?
    ']'
;

ListCount:
    'listCount' '(' list=Expression')'
;

ListAdd:
    'listAdd' '(' list=Expression ',' item=Expression ')'
;

ListRemove:
    'listRemove' '(' list=Expression (',' index=(NUM | Expression))? ')'
;

// Mathematical Functions
// 'abs' | 'acos' | 'asin' | 'atan' | 'atan2' | 'ceil' | 'cos' | 'cosh' | 'exp' | 'floor' | 'log' | 'log10' | 'max' | 'min' | 'pow' | 'round' | 'sin' | 'sinh' | 'sqrt' | 'tan' | 'tanh'

MathematicalFunction:
    Absolute |
    Cosine |
    Sine |
    Tangent |
    ArcCosine |
    ArcSine |
    ArcTangent |
    Round |
    Ceiling |
    Floor |
    Root |
    SquareRoot |
    LogarithmBaseTen |
    NaturalLogarithm |
    Minimum |
    Maximum
;

Absolute:
    'abs' '(' value=Expression')'
;

Cosine:
    'cos' '(' value=Expression')'
;

Sine:
    'sin' '(' value=Expression')'
;

Tangent:
    'tan' '(' value=Expression')'
;

ArcCosine:
    'acos' '(' value=Expression')'
;

ArcSine:
    'asin' '(' value=Expression')'
;

ArcTangent:
    'atan' '(' value=Expression')'
;

Round:
    'round' '(' value=Expression')'
;

Ceiling:
    'ceil' '(' value=Expression')'
;

Floor:
    'floor' '(' value=Expression')'
;

Root:
    'root' '(' root=Expression ',' value=Expression ')'
;

SquareRoot:
    'sqrt' '(' value=Expression')'
;

LogarithmBaseTen:
    'log10' '(' value=Expression')'
;

NaturalLogarithm:
    'ln' '(' value=Expression')'
;

Minimum:
    'min' '(' value=Expression ')'
;

Maximum:
    'max' '(' value=Expression ')'
;


ModelDeclaration:
    (export?='export')? 'model' name=ID ('extends' parentTypes+=[ModelDeclaration:ID] (',' parentTypes+=[ModelDeclaration:ID])*)? PropertyBlock
;

fragment PropertyBlock:
    '{'
        (properties+=PropertyDeclaration)*
    '}'
;

PropertyDeclaration:
    (override?='override')? name=ID (isOptional?='?')? ':' (type=TypeReference) (description=STRING)?
;

PrimitiveType infers TypeReference:
    primitive=('number' | 'text' | 'boolean' | 'null')
;

ModelType infers TypeReference:
    model=[ModelDeclaration:ID]
;

LambdaType:
    ParameterList '=>' returnType=TypeReference
;

MeasurementType:
    'number_[' unitFamily=[UnitFamilyDeclaration:ID] ']'
;

TypeReference:
    TypeUnion
;

TypeUnion infers TypeReference:
    TypeIntersection ({infer TypeUnion.left=current} operator=('or') right=TypeIntersection)*;

TypeIntersection infers TypeReference:
    PrimaryTypeReference ({infer TypeIntersection.left=current} operator=('and') right=PrimaryTypeReference)*;

PrimaryTypeReference infers TypeReference:
    ('(' TypeReference ')' |
    ModelType |
    PrimitiveType |
    MeasurementType |
    LambdaType)
    (array?='list')?
;

/**
 * Encapsulates related units of measure in a family.
 * All units of measure of the same familly should be
 * convertible to one another.
 */
UnitFamilyDeclaration:
    (export?='export')? 'unit_family' name=ID description=STRING? '{' (units+=UnitDeclaration | conversions+=ConversionDeclaration)* '}' |
    (export?='export')? 'unit_family' name=ID description=STRING? '=' complexDefinition=UnitFamilyExpression
;

UnitFamilyExpression:
    UnitFamilyMultiplication
;

UnitFamilyMultiplication infers UnitFamilyExpression:
    UnitFamilyDivision
    (
        {infer BinaryUnitFamilyExpression.left=current}
        operator="*"
        right=UnitFamilyDivision
    )*
;

UnitFamilyDivision infers UnitFamilyExpression:
    UnitFamilyExponentiation
    (
        {infer BinaryUnitFamilyExpression.left=current}
        operator="/"
        right=UnitFamilyExponentiation
    )*
;

UnitFamilyExponentiation infers UnitFamilyExpression:
    UnitFamilyCall
    (
        {infer BinaryUnitFamilyExpression.base=current}
        operator="^"
        exponent=NUM
    )*
;

UnitFamilyCall infers UnitFamilyExpression:
    '(' UnitFamilyExpression ')' |
    UnitFamily
;

UnitFamily:
    unitFamily=[UnitFamilyDeclaration:ID]
;

/**
 * Declares a type to describe a unit of measure
 */
UnitDeclaration:
    'unit' name=ID (':' longName=ID)? description=STRING?
;

/**
 * Declares the logic to convert betwen two units of measure
 * within a unit family
 */
ConversionDeclaration:
    'conversion' from=[UnitDeclaration:ID] '->' to=[UnitDeclaration:ID] ':' (formula=[FormulaDeclaration:ID] | lambda=LambdaDeclaration)
;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING returns string: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal NUM returns number: /[0-9]+(\.[0-9]*)?/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;