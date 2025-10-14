import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { localUserModel } from "../database/schemas/local_user.schema.js";
import { Bcrypt } from "../public/utils/bcrypt.util.js";

passport.serializeUser((user: any, done) => {
  console.log("serializing user...");
  console.log(user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("deserializing user");
  console.log(id);
  try {
    const user = await localUserModel.findById(id);
    if (!user) throw new Error("User not found");
    done(null, user);
  } catch (err) {
    console.log(err)
    done(err, null);
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email_or_username",
      passwordField: "login_password",
    },
    async (email_or_username, password, done) => {
      try {
        const localUser = await localUserModel.findOne({
          $or: [{ email: email_or_username }, { username: email_or_username }],
        });
        if (!localUser) throw new Error("No user found");
        const isValid = Bcrypt.comparePasswords(password, localUser?.password);
        if (!isValid) throw new Error("Wrong password");
        done(false, localUser);
      } catch (err) {
        console.log(err)
        done(err, false);
      }
    }
  )
);
