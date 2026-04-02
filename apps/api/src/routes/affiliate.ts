import { Router } from "express";
import { z } from "zod";

const affiliateRouter = Router();

const affiliateClickSchema = z.object({
  restaurantId: z.string().min(1),
  partner: z.enum(["delivery", "reservation"]),
  destination: z.string().url(),
  context: z.string().min(1).max(80).optional(),
});

affiliateRouter.post("/click", (request, response) => {
  const parsed = affiliateClickSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  response.status(204).send();
});

export { affiliateRouter };
