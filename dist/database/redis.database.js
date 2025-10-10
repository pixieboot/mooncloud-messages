"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
// export namespace RedisClient {
//   const redis_uri = `${process.env.REDIS_URI}`;
//   const client = createClient({
//     url: redis_uri,
//   });
//   export async function _connect() {
//     try {
//       await client.connect();
//       logger.info("Connected to redis db");
//     } catch (err) {
//       logger.error(`Failed to connect to the redis db ${err}`);
//       process.exit();
//     }
//   }
//   client.on("connect", () => logger.info("Client connected to redis"));
//   client.on("error", (err) => logger.error("Redis client err: ", err));
//   export let redisGracefulExit = () => {
//     logger.warn(
//       "Redis client connection is disconnected through app termination"
//     );
//     client.quit();
//   };
// }
//# sourceMappingURL=redis.database.js.map