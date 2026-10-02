import { Router } from "express";

export interface AppRoute {
  getRouter(): Router;
}
