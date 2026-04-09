import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verifyAuthToken } from "../lib/jwt.js";

const affiliateRouter = Router();

const affiliateClickSchema = z.object({
  restaurantId: z.string().min(1),
  partner: z.enum(["delivery", "reservation"]),
  destination: z.string().url(),
  context: z.string().min(1).max(80).optional(),
});

affiliateRouter.post("/click", async (request, response) => {
  const parsed = affiliateClickSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  let userId: string | undefined = undefined;
  try {
    const cookies = (request as any).cookies;
    const cookieToken = cookies?.pp_token;
    const header = request.header("authorization");
    const token = cookieToken ?? (header?.startsWith("Bearer ") ? header.slice(7).trim() : null);
    if (token) {
      const payload = verifyAuthToken(token);
      userId = payload.sub;
    }
  } catch (err) {
    // Ignore invalid token for affiliate tracking
  }

  try {
    await prisma.affiliateClick.create({
      data: {
        restaurantId: parsed.data.restaurantId,
        partner: parsed.data.partner,
        destination: parsed.data.destination,
        context: parsed.data.context,
        userId: userId,
      }
    });
  } catch (err) {
    console.error("Failed to log affiliate click", err);
  }

  response.status(204).send();
});

export { affiliateRouter };
