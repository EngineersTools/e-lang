import { TypeEnvironment } from "./TypeEnvironment.class.js";
import { TypeDescription } from "./descriptions.js";

export type Substitution = {
  $type: "substitution";
  (t: TypeDescription): TypeDescription;
  (e: TypeEnvironment): TypeEnvironment;
  raw: Map<string, TypeDescription>;
};

export const makeSubstitution = (raw: Substitution["raw"]): Substitution => {
  const fn = ((arg: TypeDescription | TypeEnvironment) => {
    return apply(fn, arg);
  }) as Substitution;

  fn.$type = "substitution";
  fn.raw = raw;

  return fn;
};

function apply<T extends TypeDescription | TypeEnvironment>(substitution: Substitution, arg: T): T;
function apply(substitution: Substitution, arg: TypeDescription | TypeEnvironment): TypeDescription | TypeEnvironment | undefined {
    if (arg instanceof TypeEnvironment) {
        return applyEnvironment(substitution, arg);
    } else {
        return undefined
        // return applyType(substitution, arg);
    }
}

function applyEnvironment(substitution: Substitution, env: TypeEnvironment): TypeEnvironment {
    const newEnv = new TypeEnvironment();
    
    newEnv.enterScope()

    newEnv.leaveScope()
    
    
    // newEnv.stack = env.stack.map((scope) => {
    //     const newScope = new Map();
    //     for (const [key, value] of scope) {
    //         newScope.set(key, applyType(substitution, value));
    //     }
    //     return newScope;
    // });
    // });
    // });


    return newEnv;
}