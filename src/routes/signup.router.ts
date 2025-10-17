import { Router } from "express";
import { User } from "../classes/user.class.js";
import { imageUpload } from "../public/utils/multer.util.js";
import { localUserModel } from "../database/schemas/local_user.schema.js";
import sanitizeHtml from "sanitize-html";
var router = Router();

router.post(
  "/signup",
  imageUpload.single("upload_user_avatar"),
  async (req, res) => {
    const email = sanitizeHtml(req.body.email);
    const password = sanitizeHtml(req.body.password);
    const username: string | undefined = sanitizeHtml(req.body.username).toLocaleLowerCase();
    const avatar: string | undefined = req.file?.filename;

    const userEmail = await localUserModel.findOne({ email: email });
    if (userEmail) {
      req.flash(
        "user_exists",
        "Email is already in use, please use a different one!"
      );
      return res.redirect(301, "/signup");
    }

    const userUsername = await localUserModel.findOne({ username: username });
    if (userUsername) {
      req.flash(
        "user_exists",
        "Username is already in use, please use a different one!"
      );
      return res.redirect(301, "/signup");
    }

    try {
      const newUser = new User(email, password);
      await newUser.setLocalUser();
      await newUser.updateLocalUser(email, username, avatar);
      req.flash(
        "acc_created",
        "Your account was successfully made, enter your credentials to login!"
      );
      return res.redirect(301, "/login");
    } catch (err) {
      console.error(err);
    }
  }
);

export const localSignupRouter = router;
