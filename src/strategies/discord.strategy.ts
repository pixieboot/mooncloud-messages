import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import "dotenv/config";
import discordUser from "../database/schemas/discord_user.schema.js";

export const authenticateDiscordUser = passport.use(
  new DiscordStrategy(
    {
      clientID: `${process.env.CLIENT_ID}`,
      clientSecret: `${process.env.CLIENT_SECRET}`,
      callbackURL: "http://localhost:3000/auth/discord/redirect",
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(accessToken, refreshToken);
      console.log(profile);
      try {
        const discordUserDB = await discordUser.findOne({
          discordID: profile.id,
        });
        if (discordUserDB) {
          console.log(`Found user: ${discordUser}`);
          return done(null, discordUserDB);
        } else {
          const newDiscordUser = await discordUser.create({
            discordID: profile.id,
            discordEmail: profile.email,
            discordUsername: profile.username,
          });
          console.log(`Created new user: ${newDiscordUser}`);
          return done(null, newDiscordUser);
        }
      } catch (err: any) {
        console.log(err);
        return done(err, false);
      }
    }
  )
);
