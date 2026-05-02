export class MeasurementNumber {
  constructor(
    public value: number,
    public unit: string,
  ) {}

  add(other: MeasurementNumber | number): MeasurementNumber {
    if (typeof other === "number") {
      return new MeasurementNumber(this.value + other, this.unit);
    }
    return new MeasurementNumber(this.value + other.value, other.unit);
  }

  sub(other: MeasurementNumber | number): MeasurementNumber {
    if (typeof other === "number") {
      return new MeasurementNumber(this.value - other, this.unit);
    }
    return new MeasurementNumber(this.value - other.value, other.unit);
  }

  mul(other: MeasurementNumber | number): MeasurementNumber {
    if (typeof other === "number") {
      return new MeasurementNumber(this.value * other, this.unit);
    }
    return new MeasurementNumber(this.value * other.value, other.unit);
  }

  div(other: MeasurementNumber | number): MeasurementNumber {
    if (typeof other === "number") {
      return new MeasurementNumber(this.value / other, this.unit);
    }
    return new MeasurementNumber(this.value / other.value, this.unit);
  }

  toString(): string {
    return `${this.value} ~${this.unit}`;
  }
}
