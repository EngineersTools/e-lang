export class ComplexNumber {
  constructor(public real: number, public imag: number) {}

  add(other: ComplexNumber | number): ComplexNumber {
    if (typeof other === "number") {
      return new ComplexNumber(this.real + other, this.imag);
    }
    return new ComplexNumber(this.real + other.real, this.imag + other.imag);
  }

  sub(other: ComplexNumber | number): ComplexNumber {
    if (typeof other === "number") {
      return new ComplexNumber(this.real - other, this.imag);
    }
    return new ComplexNumber(this.real - other.real, this.imag - other.imag);
  }

  mul(other: ComplexNumber | number): ComplexNumber {
    if (typeof other === "number") {
      return new ComplexNumber(this.real * other, this.imag * other);
    }
    return new ComplexNumber(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  div(other: ComplexNumber | number): ComplexNumber {
    if (typeof other === "number") {
      return new ComplexNumber(this.real / other, this.imag / other);
    }
    const denominator = other.real * other.real + other.imag * other.imag;
    return new ComplexNumber(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  toString(): string {
    if (this.real === 0) return `${this.imag}im`;
    if (this.imag === 0) return `${this.real}`;
    const op = this.imag < 0 ? "-" : "+";
    return `${this.real} ${op} ${Math.abs(this.imag)}im`;
  }
}
