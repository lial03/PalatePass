import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { affiliateRouter } from "./routes/affiliate.js";
import { authRouter } from "./routes/auth.js";
import { listsRouter } from "./routes/lists.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { restaurantsRouter } from "./routes/restaurants.js";
import { usersRouter } from "./routes/users.js";


const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL ?? true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

// Root health check for the deployment
app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "palatepass-api",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Main API Router for Vercel compatibility
const apiRouter = express.Router();
apiRouter.use("/affiliate", affiliateRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/recommendations", recommendationsRouter);
apiRouter.use("/restaurants", restaurantsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/lists", listsRouter);

// Apply the global /api prefix
app.use("/api", apiRouter);
app.use(apiRouter);

// Fallback for non-prefixed health check (legacy)
app.get("/health", (_request, response) => {
  response.json({ status: "ok", legacy: true });
});

// Conditional listen for local development
if (process.env.NODE_ENV !== "production") {
  const server = app.listen(env.PORT || 4000, () => {
    console.log(`PalatePass API listening on http://localhost:${env.PORT || 4000}`);
  });

  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  });

  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  });
}

export default app;
