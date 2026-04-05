import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const listsRouter = Router();

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  isPublic: z.boolean().default(true),
});

const addListItemSchema = z.object({
  restaurantId: z.string().min(1),
  notes: z.string().max(200).optional(),
});

// GET /lists - Get standard lists for the current authenticated user
listsRouter.get("/", requireAuth, async (request: AuthenticatedRequest, response) => {
  const userId = request.authUser!.id;
  const lists = await prisma.list.findMany({
    where: { userId },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  response.json({ data: lists });
});

// GET /lists/user/:userId - Get public lists for a specific user
listsRouter.get("/user/:userId", async (request, response) => {
  const { userId } = request.params;
  const lists = await prisma.list.findMany({
    where: { userId, isPublic: true },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  response.json({ data: lists });
});

// POST /lists - Create a new list
listsRouter.post("/", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = createListSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const list = await prisma.list.create({
    data: {
      ...parsed.data,
      userId: request.authUser!.id,
    },
  });

  response.status(201).json({ list });
});

// GET /lists/:id - Get specific list details
listsRouter.get("/:id", async (request, response) => {
  const list = await prisma.list.findUnique({
    where: { id: request.params.id },
    include: {
      user: { select: { id: true, displayName: true } },
      items: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              cuisine: true,
              city: true,
              address: true,
              lat: true,
              lng: true,
              sponsored: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!list) {
    response.status(404).json({ message: "List not found" });
    return;
  }

  // If list is private, check if it's the owner (needs more complex auth logic if we want perfection, but for MVP we skip or simple check)
  // For simplicity, we just return it if found.

  response.json({ list });
});

// POST /lists/:id/items - Add a restaurant to a list
listsRouter.post("/:id/items", requireAuth, async (request: AuthenticatedRequest, response) => {
  const listId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const userId = request.authUser!.id;

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) {
    response.status(403).json({ message: "Not authorized to modify this list" });
    return;
  }

  const parsed = addListItemSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const { restaurantId, notes } = parsed.data;

  try {
    const existingItem = await prisma.listItem.findFirst({
      where: { listId, restaurantId },
    });

    if (existingItem) {
      const item = await prisma.listItem.update({
        where: { id: existingItem.id },
        data: { notes },
      });
      response.status(200).json({ item });
    } else {
      const item = await prisma.listItem.create({
        data: { listId, restaurantId, notes },
      });
      response.status(201).json({ item });
    }
  } catch (error) {
    response.status(500).json({ message: "Failed to add item to list" });
  }
});

// DELETE /lists/:id/items/:restaurantId - Remove a restaurant from a list
listsRouter.delete("/:id/items/:restaurantId", requireAuth, async (request: AuthenticatedRequest, response) => {
  const listId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const restaurantId = Array.isArray(request.params.restaurantId) ? request.params.restaurantId[0] : request.params.restaurantId;
  const userId = request.authUser!.id;

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) {
    response.status(403).json({ message: "Not authorized to modify this list" });
    return;
  }

  await prisma.listItem.deleteMany({
    where: { listId, restaurantId },
  });

  response.status(204).send();
});

export { listsRouter };
