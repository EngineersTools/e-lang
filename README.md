# e-lang

`e-lang` is an experimental programming language that provides higher level
abstractions specific to the needs of engineering disciplines.

## Getting Started

The best way to try `e-lang` is to install the
[VSCode extension](https://marketplace.visualstudio.com/items?itemName=EngineersTools.e-lang).
This includes an interpreter that runs e-lang notebook (*.elnb) files (see the
[examples](./examples/) folder).

### Installing CLI

`e-lang` includes a basic CLI tool. Currently the only implemented command is
`run`, which interprets a program and returns any `print` statements to the
console.

To install the CLI run:

```cmd
npm i -g @eng-tools/e-lang@latest
```

To run a file, type:

```cmd
elang run ./path/to/your/file.elng
```

This is an alpha version and it should not be used in production.

## Examples

The [examples](./examples/) folder contains e-lang notebooks with explanations
and demonstrations of the various features of this language.

## Language Summary

### File Types

| Extension | Use for                                                             |
| --------- | ------------------------------------------------------------------- |
| `.elng`   | Contains e-lang code and can be run with the CLI interpreter        |
| `.elnb`   | This is a notebook format that runs an e-lang interpreter on VSCode |

### Import and Export

To facilitate file organisation, each file can include a range of `import`
statements. Each statement would be followed by the relative path of the file
that contains the entities to be imported.

The `.elng` file extension can be safely omitted from the file name.

```
import './units'
import './helpers'
```

The entities that will be available if the file is imported have to be
explicitly exported from the source file using the `export` keyword.

```typescript
// File: units.elng
export dimension Length
export unit m : Length
```

### Dimensions and Units

`e-lang` introduces a powerful Type System based on Dimensions and Units. This
allows for compile-time checking of physical compatibility and easy unit
conversions.

#### Declaring Dimensions

Use the `dimension` keyword to declare a new physical dimension.

```typescript
dimension Length
dimension Time
```

You can also declare **Derived Dimensions** using mathematical operations on
existing dimensions:

```typescript
dimension Speed = Length / Time
dimension Area = Length * Length
```

#### Declaring Units

Units are declared using the `unit` keyword.

Base units are linked directly to a dimension:

```typescript
unit m : Length
unit s : Time
```

Derived units are defined as a multiple of another unit:

```typescript
unit km = 1000 * m
unit min = 60 * s
unit hr = 60 * min
```

Complex derived units can also be composed from other units:

```typescript
unit kph : Speed = km / hr
unit mps : Speed = m / s
```

#### Using Units in Values

To attach a unit to a value, use the `~` operator followed by the unit name.

```typescript
const distance = 100 ~m
const time = 2 ~s
```

#### Unit Conversions

You can convert between compatible units using the `->` operator.

```typescript
print 1 ~km -> m
// Output: 1000 ~m
```

#### Validations

The language enforces dimensional consistency. You cannot add or subtract values
with different dimensions (e.g., adding Length and Time). However, you _can_
operate on compatible units (e.g., adding meters and kilometers), and the
language will handle the conversion.

```typescript
// Valid
print 1 ~km + 500 ~m  // Result will be in base units or left-most unit often

// Invalid - Compile Error
// print 100 ~m + 20 ~s
```

### Variables

Variables are declared using `const` (immutable) or `var` (mutable). Type
inference is supported, but types can also be explicit.

```typescript
const pi = 3.14159;
var counter = 0;
counter = counter + 1;

const height: Number = 180;
```

### Models

Models define the structure of data objects.

```typescript
model Asset {
    id: number
    name: text
    description?: text  // Optional property
}

const myAsset : Asset = {
    id: 1,
    name: "Hydraulic Pump"
}
```

Models can inherit from other models:

```typescript
model Motor extends Asset {
    power: number
}
```

### Formulas and Functions

Reusable logic can be defined using `formula` or lambda expressions.

```typescript
formula calculateArea(l: number, w: number): number {
    return l * w
}

const double = (x: number) => x * 2
```

### Control Flow

Standard control flow statements are supported.

#### If / Else

```typescript
if (x > 10) {
    print "High"
} else {
    print "Low"
}
```

#### For Loop

```typescript
for (i from 1 to 10) {
    print i
}
```

#### Match

Pattern matching is available using the `match` keyword.

```typescript
match x {
    x < 0 => print "Negative"
    x == 0 => print "Zero"
    default => print "Positive"
}
```

### Lists

Lists can store collections of values.

```typescript
const numbers = [1, 2, 3, 4];
const first = numbers[0];
```
