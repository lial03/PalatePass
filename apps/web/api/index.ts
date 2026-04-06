import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../../api/src/index";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Pass all /api/* requests to the Express app
  return app(req, res);
}
