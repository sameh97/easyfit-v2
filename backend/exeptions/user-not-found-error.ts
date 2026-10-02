export class UserNotFoundErr extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
