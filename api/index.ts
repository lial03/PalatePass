import app from "../apps/api/src/index";

// Vercel Serverless Function entry point
export default async function handler(req: any, res: any) {
  const { url } = req;
  
  // Direct health check for Vercel troubleshooting
  // We check for both prefixed and non-prefixed paths as Vercel rewrites can vary
  if (url.includes("health")) {
    return res.status(200).json({ 
        status: "ok", 
        gateway: "vercel-root-api-v2",
        receivedUrl: url,
        timestamp: new Date().toISOString() 
    });
  }

  // Pass all other requests to the Express app
  return app(req, res);
}
