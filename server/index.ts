// Temporary file - redirects to JavaScript backend
import express from "express";
import { registerRoutes } from "./routes.js"; // Assuming routes.js is in the same directory
import { setupVite, serveStatic } from "./vite"; // Assuming vite.ts is in the same directory

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`Error ${status}: ${message}`);
  res.status(status).json({ message });
});

async function initializeApp() {
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // In production, serve the static files from the 'build' directory
    serveStatic(app);
  }

  const PORT = 5000; // Define your desired port
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initializeApp().catch(console.error);
