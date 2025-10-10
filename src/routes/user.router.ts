import { Router } from "express";
import { checkIsAuthenticated } from "../controllers/auth.controller.js";
var router = Router();

router.get("/:id", checkIsAuthenticated, async (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("mooncloud/mooncloud", {
        user: req.user,
    });
});

export const userRouter = router;