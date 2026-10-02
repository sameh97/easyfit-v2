import { NotFoundErr } from "../exeptions/not-found-error";
import { InputError } from "../exeptions/input-error";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { AuthenticationError } from "../exeptions/authentication-error";

export const globalErrorHandler = (err, req, res, next) => {
  if (err instanceof NotFoundErr) {
    res.status(404).send(err.message);
  } else if (err instanceof InputError || err instanceof AlreadyExistError) {
    res.status(400).send(err.message);
  } else if (err instanceof AuthenticationError) {
    res.status(403).send(err.message);
  } else {
    res.status(500).send(err.message);
  }
};
