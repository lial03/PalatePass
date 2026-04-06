import app from "../apps/api/src/index";

export default async function handler(req: any, res: any) {
  // Defensive routing for Vercel
  // We normalize the URL to ensure it matches what the Express app expects
  console.log("Vercel Gateway: Processing", req.url);

  // Directly handle health check for debugging
  if (req.url.includes("health")) {
    return res.status(200).json({ 
      status: "ok", 
      source: "gateway-v3", 
      url: req.url 
    });
  }

  // Ensure the Express app sees a path starting with /api if possible
  // or just pass it through
  return app(req, res);
}
