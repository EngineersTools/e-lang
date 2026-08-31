export type ValueType =
    | "number"
    | "text"
    | "boolean"
    | "null"
    | "measurement"

export interface RuntimeValue {
    type: ValueType;
}

export interface NumberValue extends RuntimeValue {
    type: "number";
    value: number;
}

export interface TextValue extends RuntimeValue {
    type: "text";
    value: string;
}

export interface BooleanValue extends RuntimeValue {
    type: "boolean";
    value: boolean;
}

export interface NullValue extends RuntimeValue {
    type: "null";
    value: null;
}

export interface MeasurementValue extends RuntimeValue {
    type: "measurement";
    value: number;
    unit: string;
}