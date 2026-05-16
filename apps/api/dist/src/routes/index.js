import { Router } from "express";
import authRoutes from "./auth.routes.js";
import projectsRoutes from "./projects.routes.js";
import reportsRoutes from "./reports.routes.js";
import ticketsRoutes from "./tickets.routes.js";
import usersRoutes from "./users.routes.js";
const router = Router();
router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/projects", projectsRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/reports", reportsRoutes);
export default router;
