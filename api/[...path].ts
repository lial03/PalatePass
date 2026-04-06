import app from "../apps/api/src/index";

export default async function handler(req: any, res: any) {
  // Forward all /api/* requests to the Express app on Vercel
  return app(req, res);
}
