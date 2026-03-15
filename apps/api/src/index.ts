import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().optional(),
});

const env = envSchema.parse({
  PORT: process.env.PORT ?? "4000",
  CLIENT_URL: process.env.CLIENT_URL,
});

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL ?? true,
  }),
);
app.use(express.json());

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

app.listen(env.PORT, () => {
  console.log(`PalatePass API listening on http://localhost:${env.PORT}`);
});
