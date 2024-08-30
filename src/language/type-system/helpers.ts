import { TypeEnvironment } from "./TypeEnvironment.js";
import { ELangType } from "./descriptions.js";

export type Substitution = {
  $type: "substitution";
  (t: ELangType): ELangType;
  (e: TypeEnvironment): TypeEnvironment;
  raw: Map<string, ELangType>;
};

export const makeSubstitution = (raw: Substitution["raw"]): Substitution => {
  const fn = ((arg: ELangType | TypeEnvironment) => {
    return apply(fn, arg);
  }) as Substitution;

  fn.$type = "substitution";
  fn.raw = raw;

  return fn;
};

function apply<T extends ELangType | TypeEnvironment>(substitution: Substitution, arg: T): T;
function apply(substitution: Substitution, arg: ELangType | TypeEnvironment): ELangType | TypeEnvironment | undefined {
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