"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_controller_js_1 = require("./user.controller.js");
exports.userRouter = (0, express_1.Router)();
const controller = new user_controller_js_1.UserController();
// Auth routes (public)
exports.userRouter.post('/login', controller.login);
exports.userRouter.post('/register', controller.register);
exports.userRouter.post('/refresh', controller.refreshToken);
// User routes (protected - auth middleware applied in index.ts)
exports.userRouter.get('/me', controller.getCurrentUser);
exports.userRouter.put('/me', controller.updateProfile);
exports.userRouter.put('/me/password', controller.changePassword);
exports.userRouter.post('/logout', controller.logout);
//# sourceMappingURL=user.routes.js.map