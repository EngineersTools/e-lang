domain UnitDefinitions

unit_family Test {
    unit one:OeUnit
    unit two:TwoUnit
}

model TestModel {
    prop1: number_[Test]
}

model TestModel2 {
    prop1: number_[Test]
}

const myModel: TestModel = {
    prop1: 1_[one]
}

print myModel

