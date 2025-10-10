"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
var router = (0, express_1.Router)();
router.get("/:id", auth_controller_1.checkIsAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("mooncloud/mooncloud", {
        user: req.user,
    });
}));
exports.userRouter = router;
//# sourceMappingURL=user.router.js.map