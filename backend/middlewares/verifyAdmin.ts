import { UserService } from "../services/user-service";
import jwt_decode from "jwt-decode";
import { User } from "../models/user";

const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  const decodedToken: any = jwt_decode(token);

  const user: User = { ...decodedToken.sub };

  if (user.roleId !== 2) {
    return res.sendStatus(403);
  } else {
    next();
  }
};

module.exports = verifyAdmin;
