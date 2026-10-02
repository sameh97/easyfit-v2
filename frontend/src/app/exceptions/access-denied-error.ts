
export class AccessDeniedError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AccessDeniedError.prototype);
    }
}