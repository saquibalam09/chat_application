import express from "express";
import cors from "cors";
import { createServer } from "http";
import cookieParser from "cookie-parser";
// import morganMiddleware from "./logger/morgan.logger";
import { seedUsers } from "./seeds/user.seeds.js";
import { seedChatApp } from "./seeds/chat-app.seeds.js";
import morganMiddleware from "./logger/morgan.logger.js";
import userRouter from "./routes/user.routes.js";

const app = express();

const httpServer = createServer(app);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // configure static file to save images locally
app.use(cookieParser());

app.use(morganMiddleware);
// app.use(morganMiddleware);

// global middlewares
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*" // This might give CORS error for some origins due to credentials set to true
        : process.env.CORS_ORIGIN?.split(","), // For multiple cors origin for production. Refer https://github.com/hiteshchoudhary/apihub/blob/a846abd7a0795054f48c7eb3e71f3af36478fa96/.env.sample#L12C1-L12C12
    credentials: true,
  })
);

app.use("/api/v1/users", userRouter);

// app.use("/api/v1/chat-app/chats", chatRouter);
// app.use("/api/v1/chat-app/messages", messageRouter);

app.post(
  "/api/v1/seed/chat-app",
  // avoidInProduction,
  seedUsers,
  seedChatApp
);

export { httpServer };
