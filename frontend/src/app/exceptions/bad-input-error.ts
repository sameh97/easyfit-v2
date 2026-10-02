
export class BadInputError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, BadInputError.prototype);
    }
}
