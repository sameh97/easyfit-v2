export class NotFoundErr extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
