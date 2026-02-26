import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT! || 3000;

import { bootstrapSuperAdmin } from "./bootstrap";

async function startServer() {
  await bootstrapSuperAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();