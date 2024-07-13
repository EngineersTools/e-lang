domain UnitDefinitions

export unit_family Test {
    unit one: OneUnit
    unit two: TwoUnit
}

export unit_family TestFamily2 {
    unit three: OneUnit
    unit four: TwoUnit
}

model TestModel {
    prop1: number_[Test]
}

model TestModel2 {
    prop1: number_[Test]
}

export const myModel: TestModel = {
    prop1: 1_[one]
}

print myModel

