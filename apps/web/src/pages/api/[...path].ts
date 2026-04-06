import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Diagnostic probe: if this returns JSON in production, the catch-all route is active.
  if (req.method === "GET" && req.url?.includes("/api/health")) {
    return res.status(200).json({
      status: "ok",
      source: "next-pages-api-catchall",
    });
  }

  try {
    const mod = await import("../../../../api/src/index");
    const app = mod.default;

    // Route all Next.js /api/* calls to the shared Express app.
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API bootstrap error";

    return res.status(500).json({
      message: "API bootstrap failed",
      error: message,
    });
  }
}
