import express from "express"
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

app.use(
    cors(
        {
            origin: "http://localhost:3000",
            credentials: true
        },
        {
            origin: "mytube-xi-two.vercel.app",
            credentials: true
        }
    )
)

app.use(express.json());


app.get("/" , (req, res ) => {
    res.send("API running")
})

app.use(cookieParser())

app.use("/api/auth", authRoutes)

export default app