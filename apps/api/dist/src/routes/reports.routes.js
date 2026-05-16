import dayjs from "dayjs";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/overview", async (_req, res) => {
    const [projects, tickets, users, timeLogs, points] = await Promise.all([
        prisma.project.findMany({ include: { tickets: true } }),
        prisma.ticket.findMany({
            include: {
                pointEvents: true,
                assignee: { select: { id: true, name: true, role: true } }
            }
        }),
        prisma.user.findMany(),
        prisma.timeLog.findMany(),
        prisma.ticketPointsLog.findMany({
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: "desc" }
        })
    ]);
    const ticketsByStatus = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] ?? 0) + 1;
        return acc;
    }, {});
    const projectCompletion = projects.map((project) => {
        const done = project.tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length;
        const overdue = project.tickets.filter((ticket) => ticket.endDate && !["RESOLVED", "CLOSED"].includes(ticket.status) && ticket.endDate < new Date()).length;
        return {
            projectId: project.id,
            projectName: project.name,
            totalTickets: project.tickets.length,
            doneTickets: done,
            overdueTickets: overdue,
            completionRate: project.tickets.length ? Math.round((done / project.tickets.length) * 100) : 0
        };
    });
    const totalLoggedHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    const overdueTickets = tickets.filter((ticket) => ticket.endDate && !["RESOLVED", "CLOSED"].includes(ticket.status) && ticket.endDate < new Date()).length;
    const bugCount = tickets.filter((ticket) => ticket.isBug).length;
    const leaderboard = users
        .map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        totalPoints: user.totalPoints
    }))
        .sort((left, right) => right.totalPoints - left.totalPoints)
        .slice(0, 10);
    const pointsTrendMap = points.reduce((acc, entry) => {
        const key = dayjs(entry.createdAt).format("YYYY-MM-DD");
        acc[key] = (acc[key] ?? 0) + entry.delta;
        return acc;
    }, {});
    res.json({
        stats: {
            totalProjects: projects.length,
            totalTickets: tickets.length,
            totalUsers: users.length,
            totalLoggedHours,
            overdueTickets,
            bugCount
        },
        ticketsByStatus,
        projectCompletion,
        leaderboard,
        pointsTrend: Object.entries(pointsTrendMap).map(([date, delta]) => ({ date, delta }))
    });
});
router.get("/date-wise", async (req, res) => {
    const from = req.query.from?.toString() ?? dayjs().subtract(30, "day").startOf("day").toISOString();
    const to = req.query.to?.toString() ?? dayjs().endOf("day").toISOString();
    const logs = await prisma.timeLog.findMany({
        where: {
            loggedAt: {
                gte: new Date(from),
                lte: new Date(to)
            }
        }
    });
    const grouped = logs.reduce((acc, log) => {
        const key = dayjs(log.workDate ?? log.loggedAt).format("YYYY-MM-DD");
        acc[key] = (acc[key] ?? 0) + log.hours;
        return acc;
    }, {});
    res.json(grouped);
});
router.get("/user-wise", async (_req, res) => {
    const users = await prisma.user.findMany({
        include: {
            assignedTickets: {
                include: {
                    bugs: true
                }
            },
            timeLogs: true,
            pointEvents: true
        }
    });
    res.json(users.map((user) => {
        const onTime = user.pointEvents.filter((entry) => entry.eventType === "on_time").length;
        const overdue = user.pointEvents.filter((entry) => entry.eventType === "overdue").length;
        const bugMinor = user.pointEvents.filter((entry) => entry.eventType === "bug_minor").length;
        const bugMajor = user.pointEvents.filter((entry) => entry.eventType === "bug_major").length;
        const bugCritical = user.pointEvents.filter((entry) => entry.eventType === "bug_critical").length;
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            assignedTickets: user.assignedTickets.length,
            loggedHours: user.timeLogs.reduce((sum, log) => sum + log.hours, 0),
            totalPoints: user.totalPoints,
            onTime,
            overdue,
            bugMinor,
            bugMajor,
            bugCritical
        };
    }));
});
router.get("/project-wise", async (_req, res) => {
    const projects = await prisma.project.findMany({
        include: {
            tickets: {
                include: {
                    timeLogs: true
                }
            }
        },
        orderBy: { name: "asc" }
    });
    res.json(projects.map((project) => ({
        id: project.id,
        code: project.code,
        name: project.name,
        status: project.status,
        tickets: project.tickets.length,
        completedTickets: project.tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length,
        estimatedHours: project.tickets.reduce((sum, ticket) => sum + (ticket.estimatedHours ?? 0), 0),
        actualHours: project.tickets.reduce((sum, ticket) => sum + ticket.actualHours, 0),
        overdueTickets: project.tickets.filter((ticket) => ticket.endDate && !["RESOLVED", "CLOSED"].includes(ticket.status) && ticket.endDate < new Date()).length
    })));
});
router.get("/task-wise", async (_req, res) => {
    const tickets = await prisma.ticket.findMany({
        include: {
            assignee: { select: { name: true } },
            project: { select: { name: true, code: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    res.json(tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        project: ticket.project,
        assignee: ticket.assignee?.name ?? null,
        estimatedHours: ticket.estimatedHours ?? 0,
        actualHours: ticket.actualHours,
        isBug: ticket.isBug,
        bugSeverity: ticket.bugSeverity ?? null
    })));
});
router.get("/leaderboard", async (_req, res) => {
    const users = await prisma.user.findMany({
        orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
        select: {
            id: true,
            name: true,
            role: true,
            totalPoints: true
        }
    });
    res.json(users);
});
router.get("/bug-analytics", async (_req, res) => {
    const bugs = await prisma.bug.findMany({
        include: {
            ticket: { select: { id: true, ticketNumber: true, title: true, assigneeId: true } },
            reportedBy: { select: { id: true, name: true, role: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    const bySeverity = bugs.reduce((acc, bug) => {
        acc[bug.severity] = (acc[bug.severity] ?? 0) + 1;
        return acc;
    }, {});
    const trend = bugs.reduce((acc, bug) => {
        const key = dayjs(bug.createdAt).format("YYYY-MM-DD");
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});
    res.json({
        total: bugs.length,
        bySeverity,
        recent: bugs.slice(0, 12),
        trend: Object.entries(trend).map(([date, count]) => ({ date, count }))
    });
});
router.get("/timeline/:userId", async (req, res) => {
    const userId = String(req.params.userId);
    const from = req.query.from?.toString();
    const to = req.query.to?.toString();
    const projectId = req.query.projectId?.toString();
    const logs = await prisma.timeLog.findMany({
        where: {
            userId,
            loggedAt: from || to ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } : undefined,
            ticket: projectId ? { projectId } : undefined
        },
        include: {
            ticket: {
                select: {
                    id: true,
                    ticketNumber: true,
                    title: true,
                    status: true,
                    bugSeverity: true,
                    project: { select: { id: true, name: true, code: true } }
                }
            }
        },
        orderBy: { loggedAt: "desc" }
    });
    const pointEvents = await prisma.ticketPointsLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
    });
    const dailyHours = logs.reduce((acc, log) => {
        const key = dayjs(log.workDate ?? log.loggedAt).format("YYYY-MM-DD");
        acc[key] = (acc[key] ?? 0) + log.hours;
        return acc;
    }, {});
    res.json({
        dailyHours: Object.entries(dailyHours).map(([date, hours]) => ({ date, hours })),
        tickets: logs.map((log) => ({
            id: log.ticket.id,
            ticketNumber: log.ticket.ticketNumber,
            title: log.ticket.title,
            status: log.ticket.status,
            project: log.ticket.project,
            hours: log.hours,
            note: log.description ?? "",
            workDate: (log.workDate ?? log.loggedAt).toISOString()
        })),
        totals: {
            loggedHours: logs.reduce((sum, log) => sum + log.hours, 0),
            estimatedHours: logs.reduce((sum, log) => sum + (log.ticket ? 0 : 0), 0),
            totalPoints: pointEvents.reduce((sum, entry) => sum + entry.delta, 0)
        },
        bugs: pointEvents.reduce((acc, entry) => {
            if (entry.bugSeverity) {
                acc[entry.bugSeverity] = (acc[entry.bugSeverity] ?? 0) + 1;
            }
            return acc;
        }, {}),
        pointEvents
    });
});
export default router;
