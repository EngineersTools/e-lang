# e-lang: The Engineering Programming Language

`e-lang` is an experimental, domain-specific programming language designed from the ground up for engineering disciplines. By providing higher-level abstractions tailored to physical computing, `e-lang` makes it easier to write safe, mathematically verifiable engineering software.

## 🌟 Core Philosophy

`e-lang` is not a general-purpose programming language; it is an engineering engine. Its killer feature is native, syntax-level support for **Dimensional Analysis** and **Unit Arithmetic**.

1. **Dimensional Analysis as a First-Class Citizen**: Units are not external libraries; they are intrinsic to the type system. Adding `Length` to `Time` results in a strict compile-time error. Multiplying `Length` by `Time` creates a dynamically derived algebraic type.
2. **Structural over Nominal Typing**: In `e-lang`, units use structural typing based on "Dimension Vectors". Any unit that mathematically reduces to the same vector is of the same type (e.g., `meter` and `foot` are both structurally `Length`).
3. **Zero-Cost Abstraction**: The complex type-checking of units exists purely at compile time for developer ergonomics. At runtime, all variables are erased to dimensionless primitive scalars (standard 64-bit floats), normalized to base units. 

---

## 🚀 Getting Started

The best way to try `e-lang` is to install the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=EngineersTools.e-lang). This includes an interactive interpreter that runs e-lang notebook (`*.elnb`) files.

### Installing the CLI

`e-lang` includes a basic CLI tool to run standalone script files (`.elng`). Currently, the only implemented command is `run`, which interprets a program and returns any `print` statements to the console.

```bash
npm i -g @eng-tools/e-lang@latest
```

To run an e-lang file, simply type:
```bash
elang run ./path/to/your/file.elng
```

*(Note: This is an alpha version and it should not be used in production environments.)*

---

## 📚 Language Tour: The Basics

### Variables and Types

Variables in `e-lang` are declared using `const` (immutable) or `var` (mutable). `e-lang` supports strong type inference, but explicit type annotations are available.

```typescript
// Immutable constants
const PI = 3.14159
const MAX_VALUE: number = 100
const greeting: text = "Welcome to e-lang"

// Mutable variables
var counter: number = 0
var isActive: boolean = true

// Reassignment
counter = 42
```

### Type System and Unions

The type system supports basic primitives (`number`, `text`, `boolean`, `null`), lists, models, and **Union Types**.

```typescript
// Type union - value can be number OR text
formula flexible(value: number or text) : text {
    return value
}

// Nullable type
const empty: null = null
```

---

## 📐 Dimensions and Units (The Core Feature)

The defining feature of `e-lang` is its ability to natively model physical quantities.

### Declaring Dimensions

You can define base dimensions using the `dimension` keyword, and compose derived dimensions using mathematical operations (`*`, `/`, `^`).

```typescript
// Base dimensions
dimension Length
dimension Mass
dimension Time

// Derived dimensions
dimension Area = Length ^ 2
dimension Velocity = Length / Time
dimension Acceleration = Length / (Time ^ 2)
dimension Force = Mass * Length / (Time ^ 2)
```

### Declaring Units

Once a dimension is declared, you can define `unit`s that belong to it. A unit can either be explicitly assigned to a dimension (a base unit), or mathematically derived from other units.

```typescript
// Base units assigned to a dimension
unit meter : Length
unit kilogram : Mass
unit second : Time

// Derived units defined as multiples of other units
unit kilometer = 1000 * meter
unit gram = kilogram / 1000
unit minute = 60 * second

// Complex composite units
unit newton = kilogram * meter / (second ^ 2)
unit pascal = newton / (meter ^ 2)
unit joule = newton * meter
unit watt = joule / second
```

---

## 📏 Measurements and Conversions

In `e-lang`, a measurement is composed of a dimensionless scalar value combined with a unit type. 

### The Measurement Operator (`~`)
Attach a unit to a value using the `~` operator.

```typescript
const distance = 100 ~ meter
const time = 10 ~ second
const height = 5.5 ~ meter

// Mathematical operations with units create new dynamic unit types
const area = (10 ~ meter) * (5 ~ meter)             // Result in meter^2
const speed = (100 ~ meter) / (10 ~ second)         // Result in meter/second
```

### The Unit Conversion Operator (`->`)
You can project or convert measurements into compatible units using the `->` operator. The compiler checks if the dimensions match.

```typescript
const distance_in_km = 1000 ~ meter -> kilometer
const weight_in_grams = 5 ~ kilogram -> gram

// Valid Conversion
print 1 ~ kilometer + 500 ~ meter

// Invalid Conversion (Compile Time Error!)
// print 100 ~ meter + 20 ~ second 
```

### Imaginary Numbers (`im`)
`e-lang` has native support for complex / imaginary numbers, heavily used in electrical and signal engineering.

```typescript
const complex_val = 5im
const five_plus_3i = 5 + 3im

// Measurements with complex components
const complex_measurement = (3 + 4im) ~ meter
```

---

## 🧮 Formulas and Lambdas

Functions in `e-lang` are declared using the `formula` keyword or via lambda expressions (`=>`).

### Formulas
```typescript
// Formula with types and return types
formula add(a: number, b: number) : number {
    return a + b
}

// Optional parameters using ?
formula optional_param(x: number, y?: number) : number {
    // y can be null
    return x + 5
}
```

### Lambda Expressions
Lambdas offer a concise way to write inline functions, perfect for higher-order functions.

```typescript
// Concise lambda
const double = (x: number) => x * 2

// Lambda with a block body
const complex_calc = (x: number, y: number) : number => {
    const sum = x + y
    return sum + (x * y)
}

// Higher-order formula accepting a lambda
formula apply(fn: (number) => number, value: number) : number {
    return fn(value)
}

print apply(double, 5) // Prints 10
```

---

## 🔀 Control Flow

`e-lang` features an expressive control flow syntax.

### If / Else If / Else
```typescript
const temp = 20
if (temp > 25) {
    print "Hot"
} else_if (temp >= 15 and temp <= 25) {
    print "Comfortable"
} else {
    print "Cold"
}
```

### For Loops
`for` loops natively support explicit ranges, variables, and step sizes.

```typescript
// Loop from 1 to 5
for (var i: number = 1 from 1 to 5) {
    print i
}

// Loop with custom step
for (var x: number = 0 from 0 to 50 step 5) {
    print x
}
```

### Match Statements (Pattern Matching)
The `match` statement allows for concise multi-branch conditional logic. Match statements can also return values.

```typescript
const status = 404
const message = match status {
    200 => "Success"
    404 => "Not found"
    500 => "Server error"
    default => "Unknown status"
}
```

---

## 📦 Collections and Models

### Lists
Lists can hold elements and are zero-indexed.

```typescript
const numbers = [1, 2, 3, 4, 5]
const first_val = numbers[0]

// Nested lists
const matrix = [
    [1, 2, 3],
    [4, 5, 6]
]
```

### Models (Structs)
`model` blocks define custom data structures with typed fields. 

```typescript
model Material {
    name: text,
    density: number,
    yield_strength: number
}

// Optional parameters
model Part {
    id: number,
    description?: text
}

// Instantiating a model
const steel = {
    name: "Steel S355",
    density: 7850,
    yield_strength: 355
}
```

Models can also inherit fields from other models using the `extends` keyword.

```typescript
model Beam extends Part {
    length: number,
    material: Material
}
```

---

## 🛠 Advanced Features

### Statement Blocks
Statement blocks allow you to isolate variable scope and immediately evaluate code blocks that return a value. 

```typescript
const block_result = (() => {
    var x = 10
    var y = 20
    return x + y
})()
```

### Modules (Import / Export)
To structure large projects, files can be imported and entities exported. The `.elng` extension is safely omitted in imports.

```typescript
// In dimensions.elng
export dimension Length
export unit meter : Length

// In main.elng
import './dimensions'

const my_length = 50 ~ meter
```

---

## 🏗 Real-World Scenario: Structural Analysis

Putting it all together, here is a complete example of how `e-lang` models real engineering domains using dimensions, units, models, and formulas.

```typescript
domain structural_engineering

// 1. Dimensions and Units
dimension Length
dimension Force
dimension Pressure
dimension Moment = Force * Length

unit millimeter : Length
unit newton : Force
unit kilonewton = 1000 * newton
unit megapascal : Pressure

// 2. Data Models
model Material {
    name: text,
    yield_strength: number
}

model CrossSection {
    area: number,
    inertia_moment: number,
    centroid: number
}

// 3. Formulas
formula bending_stress(moment: number, inertia: number, distance: number) : number {
    return (moment * distance) / inertia
}

// 4. Instantiation
const steel = {
    name: "Steel S355",
    yield_strength: 355
}

const beam_section = {
    area: 4260,
    inertia_moment: 8356000,
    centroid: 150
}

const length = 5000 ~ millimeter
const load = 50 ~ kilonewton

// Calculations and analysis seamlessly handle numbers and math!
```
