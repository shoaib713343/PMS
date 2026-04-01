import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT! || 3000;

import { bootstrapAdmins } from "./bootstrap";

async function startServer() {
  await bootstrapAdmins();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();