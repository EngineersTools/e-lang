import { tokenise } from "./src/frontend/lexer"

const tokens = tokenise("const x = 42")

console.log(tokens)