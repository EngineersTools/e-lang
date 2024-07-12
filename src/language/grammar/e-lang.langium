grammar ELang

import './e-lang-terminals'
import './e-lang-types'
import './e-lang-expressions'

entry ELangProgram:
    Domain
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
    LambdaDeclaration |
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
    {infer ConstantDeclaration} (export?='export')? 'const' name=ID (':' type=TypeReference)? (assignment?='=' value=(Expression | LambdaDeclaration))? |
    {infer MutableDeclaration} (export?='export')? 'var' name=ID (':' type=TypeReference)? (assignment?='=' value=(Expression | LambdaDeclaration))?
;

LambdaDeclaration:
    ParameterList 
    (':' returnType=TypeReference)? 
    '=>' 
    body=(Expression | StatementBlock) 
    (explicitOperationCall?='(' 
            (arguments+=Expression (',' arguments+=Expression)*)?
        ')'
    )?
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