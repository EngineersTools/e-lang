import './e-lang-terminals'
import './e-lang-types'

Expression:
    Assignment
;

Assignment infers Expression:
    Addition ({infer BinaryExpression.left=current} operator=('=') right=Addition)*
;

Addition infers Expression:
    Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-') right=Multiplication)*
;

Multiplication infers Expression:
    Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/') right=Exponentiation)*
;

Exponentiation infers Expression:
    Logical ({infer BinaryExpression.left=current} operator='^' right=Logical)*
;

Logical infers Expression:
    Comparison ({infer BinaryExpression.left=current} operator=('and' | 'or') right=Comparison)*
;

Comparison infers Expression:
    UnitConversionExpression ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=UnitConversionExpression)*
;

UnitConversionExpression infers Expression:
    ModelMemberCall
    (
        {infer UnitConversionExpression.left=current}
        operator=('->')
        unit=[UnitDeclaration:ID]
        (arguments+=Expression (',' arguments+=Expression)*)?
    )*
;


ModelMemberCall infers Expression:
    PrimaryExpression
    ({infer ModelMemberCall.previous=current} 
        ("." element=[NamedElement:ID])
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
    ModelMemberAssignment |
    UnaryExpression |
    ListValue |
    ListAccess |
    ListCount |
    FeatureCall
;

FeatureCall infers Expression:
    {infer ModelMemberCall}
	element=[NamedElement:ID]
    (explicitOperationCall?='('
        (
            arguments+=Expression (',' arguments+=Expression)*
        )?
    ')')?
;

ListAccess infers Expression:
    {infer ModelMemberCall}
	element=[NamedElement:ID]
    (accessElement?='[' 
        (
            index=(NUM | Expression)
        ) 
    ']')
;

UnaryExpression:
    operator=('!' | '-' | '+') value=Expression postOperator=('++' | '--')
;

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
    property=ID ':' value=Expression
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