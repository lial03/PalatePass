import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { affiliateRouter } from "./routes/affiliate.js";
import { authRouter } from "./routes/auth.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { restaurantsRouter } from "./routes/restaurants.js";
import { usersRouter } from "./routes/users.js";
import { listsRouter } from "./routes/lists.js";


const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL ?? true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.use("/affiliate", affiliateRouter);
app.use("/auth", authRouter);
app.use("/recommendations", recommendationsRouter);
app.use("/restaurants", restaurantsRouter);
app.use("/users", usersRouter);
app.use("/lists", listsRouter);

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "palatepass-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (_request, response) => {
  response.json({
    name: "PalatePass API",
    version: "0.1.0",
    modules: [
      "auth",
      "users",
      "restaurants",
      "ratings",
      "recommendations",
      "social-graph",
    ],
  });
});

const server = app.listen(env.PORT, () => {
  console.log(`PalatePass API listening on http://localhost:${env.PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
