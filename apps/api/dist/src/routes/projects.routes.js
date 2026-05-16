import { Router } from "express";
import { z } from "zod";
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { fromDelimitedString, toDelimitedString } from "../lib/transformers.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.service.js";
const router = Router();
const projectSchema = z.object({
    code: z.string().min(2).optional(),
    name: z.string().min(2),
    description: z.string().optional(),
    clientName: z.string().optional(),
    type: z.string().optional(),
    priority: z.enum(PROJECT_PRIORITIES).default("MEDIUM"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    expectedDuration: z.number().int().positive().optional(),
    status: z.enum(PROJECT_STATUSES).default("NOT_STARTED"),
    tags: z.array(z.string()).default([]),
    managerId: z.string().optional(),
    memberIds: z.array(z.string()).default([])
});
router.use(requireAuth);
function mapProject(project) {
    return {
        ...project,
        tags: fromDelimitedString(project.tags),
        startDate: project.startDate?.toISOString() ?? null,
        endDate: project.endDate?.toISOString() ?? null
    };
}
router.get("/", async (_req, res) => {
    const projects = await prisma.project.findMany({
        include: {
            manager: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, role: true } } } },
            _count: { select: { tickets: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    res.json(projects.map(mapProject));
});
router.get("/:id", async (req, res) => {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            manager: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
            tickets: {
                include: {
                    assignee: { select: { id: true, name: true, role: true } },
                    _count: { select: { comments: true, timeLogs: true } }
                },
                orderBy: { createdAt: "desc" }
            }
        }
    });
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    res.json({
        ...mapProject(project),
        tickets: project.tickets.map((ticket) => ({
            ...ticket,
            tags: fromDelimitedString(ticket.tags),
            startDate: ticket.startDate?.toISOString() ?? null,
            endDate: ticket.endDate?.toISOString() ?? null
        }))
    });
});
router.post("/", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]), async (req, res) => {
    const body = projectSchema.parse(req.body);
    const lastProject = await prisma.project.findFirst({
        orderBy: { createdAt: "desc" },
        select: { code: true }
    });
    const nextCode = body.code ?? `PRJ-${String(((Number(lastProject?.code.split("-")[1]) || 0) + 1)).padStart(4, "0")}`;
    const project = await prisma.project.create({
        data: {
            code: nextCode,
            name: body.name,
            description: body.description,
            clientName: body.clientName,
            type: body.type,
            priority: body.priority,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            expectedDuration: body.expectedDuration ?? (body.startDate && body.endDate ? Math.max(1, Math.ceil((new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) / 86400000)) : undefined),
            status: body.status,
            tags: toDelimitedString(body.tags),
            managerId: body.managerId,
            members: body.memberIds.length
                ? {
                    create: body.memberIds.map((userId) => ({
                        userId
                    }))
                }
                : undefined
        },
        include: {
            manager: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, role: true } } } },
            _count: { select: { tickets: true } }
        }
    });
    await writeAuditLog({
        actorId: req.user.id,
        action: "PROJECT_CREATED",
        entityType: "PROJECT",
        entityId: project.id
    });
    res.status(201).json(mapProject(project));
});
router.put("/:id", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]), async (req, res) => {
    const projectId = String(req.params.id);
    const body = projectSchema.partial().parse(req.body);
    const project = await prisma.project.update({
        where: { id: projectId },
        data: {
            code: body.code,
            name: body.name,
            description: body.description,
            clientName: body.clientName,
            type: body.type,
            priority: body.priority,
            startDate: body.startDate ? new Date(body.startDate) : body.startDate === "" ? null : undefined,
            endDate: body.endDate ? new Date(body.endDate) : body.endDate === "" ? null : undefined,
            expectedDuration: body.expectedDuration,
            status: body.status,
            tags: body.tags ? toDelimitedString(body.tags) : undefined,
            managerId: body.managerId === "" ? null : body.managerId
        },
        include: {
            manager: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, role: true } } } },
            _count: { select: { tickets: true } }
        }
    });
    if (body.memberIds) {
        await prisma.projectMember.deleteMany({ where: { projectId } });
        if (body.memberIds.length) {
            await prisma.projectMember.createMany({
                data: body.memberIds.map((userId) => ({
                    projectId,
                    userId
                }))
            });
        }
    }
    await writeAuditLog({
        actorId: req.user.id,
        action: "PROJECT_UPDATED",
        entityType: "PROJECT",
        entityId: project.id
    });
    const refreshed = await prisma.project.findUniqueOrThrow({
        where: { id: project.id },
        include: {
            manager: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, role: true } } } },
            _count: { select: { tickets: true } }
        }
    });
    res.json(mapProject(refreshed));
});
router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), async (req, res) => {
    const projectId = String(req.params.id);
    await prisma.project.delete({ where: { id: projectId } });
    await writeAuditLog({
        actorId: req.user.id,
        action: "PROJECT_DELETED",
        entityType: "PROJECT",
        entityId: projectId
    });
    res.status(204).send();
});
router.get("/:id/dashboard", async (req, res) => {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            tickets: true,
            members: { include: { user: true } }
        }
    });
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    const totalTickets = project.tickets.length;
    const completedTickets = project.tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length;
    const inProgressTickets = project.tickets.filter((ticket) => ticket.status === "IN_PROGRESS" || ticket.status === "UNDER_REVIEW" || ticket.status === "TESTING").length;
    const totalEstimatedHours = project.tickets.reduce((sum, ticket) => sum + (ticket.estimatedHours ?? 0), 0);
    const totalActualHours = project.tickets.reduce((sum, ticket) => sum + ticket.actualHours, 0);
    const overdueTickets = project.tickets.filter((ticket) => ticket.endDate && !["RESOLVED", "CLOSED"].includes(ticket.status) && ticket.endDate < new Date()).length;
    const leaderboard = project.members
        .map((member) => ({
        userId: member.user.id,
        name: member.user.name,
        role: member.user.role,
        totalPoints: member.user.totalPoints
    }))
        .sort((left, right) => right.totalPoints - left.totalPoints)
        .slice(0, 5);
    res.json({
        project: mapProject(project),
        metrics: {
            totalTickets,
            completedTickets,
            inProgressTickets,
            overdueTickets,
            totalEstimatedHours,
            totalActualHours,
            teamSize: project.members.length
        },
        leaderboard
    });
});
export default router;
