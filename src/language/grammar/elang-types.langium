import './elang-terminals'
import './elang'

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
    type=('number' | 'text' | 'boolean')
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
    (array?='listof')?
    ( ModelType |
    PrimitiveType |
    MeasurementType |
    LambdaType)
;

/**
 * Encapsulates related units of measure in a family.
 * All units of measure of the same familly should be
 * convertible to one another.
 */
UnitFamilyDeclaration:
    (export?='export')? 'unit_family' name=ID description=STRING? '{' (units+=UnitDeclaration | conversions+=ConversionDeclaration)* '}'
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