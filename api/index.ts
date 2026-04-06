import app from "../apps/api/src/index";

// Vercel Serverless Function entry point
// We add an extra layer of routing here to ensure /api requests hit the Express app correctly
export default async function handler(req: any, res: any) {
  // Direct health check for Vercel troubleshooting
  if (req.url === "/api/health" || req.url === "/api/health/") {
    return res.status(200).json({ 
        status: "ok", 
        gateway: "vercel-root-api",
        timestamp: new Date().toISOString() 
    });
  }

  // Pass all other requests to the Express app
  return app(req, res);
}
