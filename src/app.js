import express from "express"
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";
import cors from "cors"
import { prisma } from "./config/prisma.js";

const app = express()

app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://mytube-xi-two.vercel.app"
        ],
        credentials: true,
    })
);

app.use(express.json());


app.get("/" , (req, res ) => {
    res.send("API running")
})

app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            server: "running",
            database: "connected",
        });
    } catch (error) {
        res.status(500).json({
            server: "running",
            database: "disconnected",
            error: error.message,
        });
    }
});

app.use(cookieParser())

app.use("/api/auth", authRoutes)

export default app