import { Router } from "express";
import { loginRouter } from "./login.router.js";
import { localSignupRouter } from "./signup.router.js";
import { logoutRouter } from "./logout.router.js";
import { checkIsNotAuthenticated } from "../controllers/auth.controller.js";

const router = Router();

/* GET home page */
router.get("/", (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        user: req.user,
        warning_email: false,
        warning_username: false,
        warning_password: false,
        user_error_input: false,
        user_exists: false,
        acc_created: false,
    });
});

/* GET home/login modal */
router.get("/login", checkIsNotAuthenticated, (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        warning_email: req.flash("warning_email"),
        warning_password: req.flash("warning_password"),
        user_error_input: req.flash("error_input"),
        acc_created: req.flash("acc_created"),
        user_exists: false,
    });
});

/* GET home/signup modal */
router.get("/signup", checkIsNotAuthenticated, (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        user_exists: req.flash("user_exists"),
        warning_email: false,
        warning_username: false,
        warning_password: false,
        user_error_input: false,
        acc_created: false,
    });
});

router.post("/signup", localSignupRouter);

router.post("/login", loginRouter);

router.delete("/logout", logoutRouter);

export const mainRouter = router;
