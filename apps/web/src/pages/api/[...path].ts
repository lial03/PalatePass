import type { NextApiRequest, NextApiResponse } from "next";
import app from "../../../../api/src/index";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Route all Next.js /api/* calls to the shared Express app.
  return app(req, res);
}
