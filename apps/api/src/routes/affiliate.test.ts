import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { affiliateRouter } from "./affiliate.js";

function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/affiliate", affiliateRouter);
  return app;
}

describe("affiliate routes", () => {
  it("accepts a click event", async () => {
    const res = await request(makeTestApp())
      .post("/affiliate/click")
      .send({
        restaurantId: "rest_1",
        partner: "delivery",
        destination: "https://example.com/search?rest=1",
        context: "restaurant-detail",
      });

    expect(res.status).toBe(204);
  });

  it("rejects invalid click payloads", async () => {
    const res = await request(makeTestApp())
      .post("/affiliate/click")
      .send({
        restaurantId: "",
        partner: "delivery",
        destination: "not-a-url",
      });

    expect(res.status).toBe(400);
  });
});
