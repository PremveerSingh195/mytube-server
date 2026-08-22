import express from "express"
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";
import cors from "cors"
import { prisma } from "./config/prisma.js";

const app = express()

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://mytube-xi-two.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API running");
});

app.use("/api/auth", authRoutes);

export default app;