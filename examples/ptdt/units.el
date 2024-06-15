domain UnitsOfMeasure

import './utils'

unit_family Voltage {
    unit V:Volt
    unit kV:kiloVolt

    conversion kV->V: fromKiloToUnit
    conversion V->kV: fromUnitToKilo
}

// const volts = 1000_[V]

// print(volts)

// unit_family Current {
//     unit A:Ampere
//     unit kA:kiloAmpere

//     conversion kA->A: fromKiloToUnit
//     conversion A->kA: fromUnitToKilo
// }

// unit_family ApparentPower {
//     unit VA:VoltAmpere
//     unit kVA:kiloVoltAmpere
//     unit MVA:MegaVoltAmpere

//     conversion VA->kVA: fromUnitToKilo
//     conversion VA->MVA: fromUnitToMega

//     conversion kVA->VA: fromKiloToUnit
//     conversion kVA->MVA: fromKiloToMega
    
//     conversion MVA->VA: fromMegaToUnit
//     conversion MVA->kVA: fromMegaToKilo
// }

// unit_family RealPower {
//     unit W:Watt
//     unit kW:kiloWatt
//     unit MW:MegaWatt

//     conversion W->kW: fromUnitToKilo
//     conversion W->MW: fromUnitToMega

//     conversion kW->W: fromKiloToUnit
//     conversion kW->MW: fromKiloToMega
    
//     conversion MW->W: fromMegaToUnit
//     conversion MW->kW: fromMegaToKilo
// }

// unit_family ReactivePower {
//     unit VAr:VAr
//     unit kVAr:kiloVAr
//     unit MVAr:MegaVAr

//     conversion VAr->kVAr: fromUnitToKilo
//     conversion VAr->MVAr: fromUnitToMega

//     conversion kVAr->VAr: fromKiloToUnit
//     conversion kVAr->MVAr: fromKiloToMega
    
//     conversion MVAr->VAr: fromMegaToUnit
//     conversion MVAr->kVAr: fromMegaToKilo
// }

// formula ApparentPower(realPower: number_[RealPower], reactivePower: number_[ReactivePower]) returns number_[ApparentPower] {
//     return sqrt(realPower^2 + reactivePower^2)
// }