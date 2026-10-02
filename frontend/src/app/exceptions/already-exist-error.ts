
export class AlreadyExistError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AlreadyExistError.prototype);
    }
}
