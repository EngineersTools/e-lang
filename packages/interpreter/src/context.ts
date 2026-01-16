
export class Context {
    private variables = new Map<string, any>();

    constructor(private parent?: Context) {}

    get(name: string): any {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new Error(`Variable '${name}' not found.`);
    }

    set(name: string, value: any): void {
        // If it's already in the current scope, update it
        if (this.variables.has(name)) {
            this.variables.set(name, value);
            return;
        }
        // If it's in a parent scope, update it there
        if (this.parent && this.parent.has(name)) {
            this.parent.set(name, value);
            return;
        }
        // Otherwise, it's a new definition in the current scope (or error if we enforced declaration)
        // For this interpreter, we might assume declarations are handled by define(), 
        // but 'set' might be used for assignment to existing vars.
        throw new Error(`Variable '${name}' not defined.`);
    }

    define(name: string, value: any): void {
        this.variables.set(name, value);
    }

    has(name: string): boolean {
        if (this.variables.has(name)) return true;
        if (this.parent) return this.parent.has(name);
        return false;
    }

    createChild(): Context {
        return new Context(this);
    }
}
