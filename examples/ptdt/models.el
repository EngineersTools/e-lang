domain Models

model Asset "Root level model representing a physical asset" {
    id: text or number "The unique identifier for the asset"
    name: text "The name of the asset"
}

print Asset