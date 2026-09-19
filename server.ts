import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Cloudinary Delete Route
  app.post("/api/cloudinary/delete", async (req, res) => {
    const { publicId, cloudName, apiKey, apiSecret, resourceType } = req.body;

    if (!publicId || !cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType || "image",
      });

      res.json(result);
    } catch (error: any) {
      console.error("Cloudinary deletion error:", error);
      res.status(500).json({ error: error.message || "Failed to delete from Cloudinary" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        configFile: path.resolve(process.cwd(), "vite.config.ts"),
        server: { 
          middlewareMode: true,
          hmr: false,
          watch: null,
          ws: false
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Vite server creation failed:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server startup failed:", err);
  process.exit(1);
});
