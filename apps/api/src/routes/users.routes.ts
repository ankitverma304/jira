import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { ROLES } from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.service.js";

const router = Router();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(ROLES),
  isActive: z.boolean().default(true),
  password: z.string().min(6).optional()
});

router.use(requireAuth);

router.get("/", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { name: "asc" }
  });

  res.json({ users, roles: ROLES });
});

router.get("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

router.post("/", requireRole(["SUPER_ADMIN", "ADMIN"]), async (req, res) => {
  const body = userSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password ?? "admin123", 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive,
      passwordHash
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
  });

  await writeAuditLog({
    actorId: req.user!.id,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: user.id
  });

  res.status(201).json(user);
});

router.put("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), async (req, res) => {
  const body = userSchema.partial().parse(req.body);
  const userId = String(req.params.id);

  const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive,
      passwordHash
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
  });

  await writeAuditLog({
    actorId: req.user!.id,
    action: "USER_UPDATED",
    entityType: "USER",
    entityId: user.id
  });

  res.json(user);
});

export default router;
