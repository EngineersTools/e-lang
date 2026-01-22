export function isMeasurement(value: any): value is { value: number; unit: string; } {
    return (
        typeof value === "object" &&
        value !== null &&
        "value" in value &&
        "unit" in value &&
        isNumber(value.value) &&
        isString(value.unit)
    );
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

export function isNull(value: unknown): value is null {
    return value === null;
}

export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

export function isString(value: unknown): value is string {
    return typeof value === "string";
}
