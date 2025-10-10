import "dotenv/config";
import { ServerApiVersion } from "mongodb";
import mongoose from "mongoose";
import { logger } from "../logger";

export namespace Database {
    const db_user = `${process.env.MONGOUSER}`;
    const db_pwd = `${process.env.MONGOPASSWORD}`;
    const db_name = `${process.env.MONGO_DB_NAME}`;
    const db_host = `${process.env.MONGOHOST}`;
    const port = `${process.env.PORT}`;

    const db_uri = `mongodb://${db_user}:${db_pwd}@${db_host}:${port}`

    const serverApi = {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    };

    export async function _connect() {
        try {
            console.log(db_name)
            console.log(db_uri)
            console.log(port)
            await mongoose.connect(db_uri);
            console.log("Successfully established connection to the database")
            logger.info("Successfully established connection to the database");
        } catch (err) {
            console.error(`Failed to connect to the database ${err}`);
            logger.error(`Failed to connect to the database ${err}`);
            process.exit();
        }
    }

    mongoose.connection.on("connected", () => {
        console.log("Currently connected to: " + db_name + " db");
        logger.info("Currently connected to: " + db_name + " db");
    });

    mongoose.connection.on("error", (err) => {
        console.error("Failed to connect to db " + db_name + " on start", err);
        logger.error("Failed to connect to db " + db_name + " on start", err);
    });

    mongoose.connection.on("disconnected", () => {
        console.log("Mongoose default connection to db: " + db_name + " disconnected")
        logger.warn(
            "Mongoose default connection to db: " + db_name + " disconnected"
        );
    });

    export var gracefulExit = () => {
        console.log("Mongoose default connection with db: " +
            db_name +
            " is disconnected through app termination")
        logger.warn(
            "Mongoose default connection with db: " +
            db_name +
            " is disconnected through app termination"
        );
        mongoose.connection.close();
    };
}
