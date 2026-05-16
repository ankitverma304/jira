import { Router } from "express";
import { z } from "zod";
import {
  BUG_SEVERITIES,
  HISTORY_TYPES,
  POINT_EVENT_TYPES,
  ROLES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WORKFLOW
} from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { fromDelimitedString, toDelimitedString } from "../lib/transformers.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.service.js";

const router = Router();

const ticketSchema = z.object({
  projectId: z.string(),
  title: z.string().min(3).max(150),
  description: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  status: z.enum(TICKET_STATUSES).default("OPEN"),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  actualHours: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  watcherIds: z.array(z.string()).default([]),
  supportRequired: z.boolean().default(false),
  isBug: z.boolean().default(false),
  bugSeverity: z.enum(BUG_SEVERITIES).optional(),
  checklist: z.array(z.string()).default([]),
  dependencyIds: z.array(z.string()).default([])
});

const commentSchema = z.object({
  content: z.string().min(1),
  mentions: z.array(z.string()).default([])
});

const timeLogSchema = z.object({
  hours: z.number().positive(),
  description: z.string().optional(),
  workDate: z.string().optional(),
  isBillable: z.boolean().default(true)
});

function mapTicket(ticket: any) {
  return {
    ...ticket,
    tags: fromDelimitedString(ticket.tags),
    watcherIds: fromDelimitedString(ticket.watchers),
    startDate: ticket.startDate?.toISOString() ?? null,
    endDate: ticket.endDate?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null
  };
}

function isPrivilegedRole(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"].includes(role);
}

function getBugPointDelta(severity?: string | null) {
  switch (severity) {
    case "MINOR":
      return -1;
    case "MAJOR":
      return -5;
    case "CRITICAL":
      return -10;
    default:
      return 0;
  }
}

function getBugEventType(severity?: string | null) {
  switch (severity) {
    case "MINOR":
      return POINT_EVENT_TYPES[2];
    case "MAJOR":
      return POINT_EVENT_TYPES[3];
    case "CRITICAL":
      return POINT_EVENT_TYPES[4];
    default:
      return null;
  }
}

function canTransitionStatus(currentStatus: string, nextStatus: string, actorRole: string, actorId: string, assigneeId?: string | null) {
  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedTargets = TICKET_WORKFLOW[currentStatus] ?? [];
  if (!allowedTargets.includes(nextStatus)) {
    return false;
  }

  if (isPrivilegedRole(actorRole) && actorRole !== "DEVELOPER" && actorRole !== "QA") {
    if (currentStatus === "IN_PROGRESS" && nextStatus === "UNDER_REVIEW" && actorRole !== "TEAM_LEAD" && actorRole !== "PROJECT_MANAGER" && actorRole !== "ADMIN" && actorRole !== "SUPER_ADMIN") {
      return false;
    }
  }

  switch (`${currentStatus}:${nextStatus}`) {
    case "OPEN:IN_PROGRESS":
      return actorId === assigneeId || actorRole === "TEAM_LEAD" || isPrivilegedRole(actorRole);
    case "IN_PROGRESS:UNDER_REVIEW":
      return actorId === assigneeId || isPrivilegedRole(actorRole);
    case "UNDER_REVIEW:TESTING":
      return actorRole === "TEAM_LEAD" || actorRole === "PROJECT_MANAGER" || actorRole === "ADMIN" || actorRole === "SUPER_ADMIN";
    case "TESTING:RESOLVED":
      return actorRole === "QA" || isPrivilegedRole(actorRole);
    case "TESTING:IN_PROGRESS":
      return actorRole === "QA" || isPrivilegedRole(actorRole);
    case "RESOLVED:CLOSED":
      return actorRole === "PROJECT_MANAGER" || actorRole === "ADMIN" || actorRole === "SUPER_ADMIN";
    default:
      return isPrivilegedRole(actorRole);
  }
}

async function applyPointEvent(input: {
  ticketId: string;
  userId: string;
  actorId: string;
  eventType: string;
  delta: number;
  bugSeverity?: string | null;
  fixMinutes?: number | null;
  notes?: string;
}) {
  const event = await prisma.ticketPointsLog.create({
    data: {
      ticketId: input.ticketId,
      userId: input.userId,
      eventType: input.eventType,
      delta: input.delta,
      bugSeverity: input.bugSeverity,
      fixMinutes: input.fixMinutes,
      notes: input.notes
    }
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      totalPoints: {
        increment: input.delta
      }
    }
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: input.ticketId,
      actorId: input.actorId,
      type: "POINT_AWARDED",
      field: "points",
      fromValue: "0",
      toValue: String(input.delta),
      description: input.notes ?? `Points updated by ${input.delta}`
    }
  });

  return event;
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const projectId = req.query.projectId?.toString();
  const tickets = await prisma.ticket.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      reporter: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
      checklistItems: true,
      pointEvents: { orderBy: { createdAt: "desc" }, take: 3 },
      dependenciesFrom: {
        include: { dependsOnTicket: { select: { id: true, ticketNumber: true, title: true, status: true } } }
      },
      _count: { select: { comments: true, timeLogs: true, bugs: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(tickets.map(mapTicket));
});

router.post("/", requireRole([...ROLES]), async (req, res) => {
  const body = ticketSchema.parse(req.body);
  const project = await prisma.project.findUnique({ where: { id: body.projectId } });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true }
  });

  const nextSequence = (lastTicket?.sequence ?? 0) + 1;
  const ticketNumber = `TKT-${new Date().getFullYear()}-${String(nextSequence).padStart(4, "0")}`;
  const assigneeId = body.assigneeId || undefined;
  const reporterId = body.reporterId || req.user!.id;

  const ticket = await prisma.ticket.create({
    data: {
      sequence: nextSequence,
      ticketNumber,
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      assigneeId,
      reporterId,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      estimatedHours: body.estimatedHours,
      actualHours: body.actualHours ?? 0,
      tags: toDelimitedString(body.tags),
      watchers: toDelimitedString(body.watcherIds),
      supportRequired: body.supportRequired,
      isBug: body.isBug,
      bugSeverity: body.bugSeverity,
      checklistItems: body.checklist.length ? { create: body.checklist.map((title) => ({ title })) } : undefined,
      dependenciesFrom: body.dependencyIds.length ? { create: body.dependencyIds.map((dependsOnTicketId) => ({ dependsOnTicketId })) } : undefined,
      histories: {
        create: {
          actorId: req.user!.id,
          type: HISTORY_TYPES[0],
          description: "Ticket created"
        }
      }
    },
    include: {
      checklistItems: true,
      assignee: { select: { id: true, name: true, role: true } },
      reporter: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
      pointEvents: true,
      _count: { select: { comments: true, timeLogs: true, bugs: true } }
    }
  });

  const notificationTargets = [assigneeId, ...body.watcherIds].filter((userId): userId is string => Boolean(userId) && userId !== req.user!.id);
  if (notificationTargets.length) {
    await prisma.notification.createMany({
      data: notificationTargets.map((userId) => ({
        userId,
        title: "Ticket assigned",
        body: `${ticket.ticketNumber} has been created and routed to your queue`
      }))
    });
  }

  await writeAuditLog({
    actorId: req.user!.id,
    action: "TICKET_CREATED",
    entityType: "TICKET",
    entityId: ticket.id
  });

  res.status(201).json(mapTicket(ticket));
});

router.put("/:id", requireRole([...ROLES]), async (req, res) => {
  const ticketId = String(req.params.id);
  const body = ticketSchema.partial().parse(req.body);
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      timeLogs: { orderBy: { loggedAt: "desc" }, take: 1 }
    }
  });

  if (!existing) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const nextStatus = body.status ?? existing.status;
  if (
    body.status &&
    !canTransitionStatus(existing.status, body.status, req.user!.role, req.user!.id, body.assigneeId ?? existing.assigneeId)
  ) {
    return res.status(403).json({ message: `Transition from ${existing.status} to ${body.status} is not allowed for your role` });
  }

  if (body.status === "TESTING" && !existing.assigneeId && !body.assigneeId) {
    return res.status(400).json({ message: "Assign the ticket before sending it to testing" });
  }

  const updateData: Record<string, unknown> = {
    projectId: body.projectId,
    title: body.title,
    description: body.description,
    priority: body.priority,
    status: body.status,
    assigneeId: body.assigneeId === "" ? null : body.assigneeId,
    reporterId: body.reporterId === "" ? null : body.reporterId,
    startDate: body.startDate ? new Date(body.startDate) : body.startDate === "" ? null : undefined,
    endDate: body.endDate ? new Date(body.endDate) : body.endDate === "" ? null : undefined,
    estimatedHours: body.estimatedHours,
    actualHours: body.actualHours,
    tags: body.tags ? toDelimitedString(body.tags) : undefined,
    watchers: body.watcherIds ? toDelimitedString(body.watcherIds) : undefined,
    supportRequired: body.supportRequired,
    isBug: body.isBug,
    bugSeverity: body.bugSeverity
  };

  if (existing.status === "OPEN" && nextStatus === "IN_PROGRESS" && !existing.startDate && !body.startDate) {
    updateData.startDate = new Date();
  }

  if (nextStatus === "RESOLVED") {
    updateData.closedAt = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      reporter: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
      checklistItems: true,
      pointEvents: { orderBy: { createdAt: "desc" } },
      _count: { select: { comments: true, timeLogs: true, bugs: true } }
    }
  });

  if (body.checklist) {
    await prisma.ticketChecklistItem.deleteMany({ where: { ticketId } });
    if (body.checklist.length) {
      await prisma.ticketChecklistItem.createMany({
        data: body.checklist.map((title) => ({ ticketId, title }))
      });
    }
  }

  if (body.dependencyIds) {
    await prisma.ticketDependency.deleteMany({ where: { ticketId } });
    if (body.dependencyIds.length) {
      await prisma.ticketDependency.createMany({
        data: body.dependencyIds.map((dependsOnTicketId) => ({ ticketId, dependsOnTicketId }))
      });
    }
  }

  if (body.status && body.status !== existing.status) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: req.user!.id,
        type: "STATUS_CHANGED",
        field: "status",
        fromValue: existing.status,
        toValue: body.status,
        description: `Status changed from ${existing.status} to ${body.status}`
      }
    });

    const recipients = [ticket.assigneeId, ...fromDelimitedString(ticket.watchers)].filter(
      (userId): userId is string => Boolean(userId) && userId !== req.user!.id
    );

    if (recipients.length) {
      await prisma.notification.createMany({
        data: recipients.map((userId) => ({
          userId,
          title: "Ticket status updated",
          body: `${ticket.ticketNumber} moved to ${String(body.status ?? nextStatus).split("_").join(" ")}`
        }))
      });
    }
  }

  if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: req.user!.id,
        type: "ASSIGNED",
        field: "assigneeId",
        fromValue: existing.assigneeId ?? "",
        toValue: body.assigneeId ?? "",
        description: "Ticket reassigned"
      }
    });

    if (body.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: body.assigneeId,
          title: "Ticket assigned",
          body: `${ticket.ticketNumber} has been assigned to you`
        }
      });
    }
  }

  if (existing.status !== "RESOLVED" && nextStatus === "RESOLVED" && ticket.assigneeId) {
    const isOnTime = ticket.endDate ? new Date(ticket.closedAt ?? new Date()) <= new Date(ticket.endDate) : true;
    const delta = isOnTime ? 1 : -1;
    await applyPointEvent({
      ticketId,
      userId: ticket.assigneeId,
      actorId: req.user!.id,
      eventType: isOnTime ? POINT_EVENT_TYPES[0] : POINT_EVENT_TYPES[1],
      delta,
      notes: isOnTime ? "Task completed on time" : "Task completed after due date"
    });
  }

  if (existing.status === "TESTING" && nextStatus === "IN_PROGRESS" && ticket.assigneeId) {
    const severity = body.bugSeverity ?? existing.bugSeverity ?? "MAJOR";
    const latestTimeLog = existing.timeLogs[0];
    const fixMinutes = latestTimeLog ? Math.round(latestTimeLog.hours * 60) : null;
    const eventType = getBugEventType(severity);
    const delta = getBugPointDelta(severity);

    await prisma.bug.create({
      data: {
        ticketId,
        severity,
        reportedById: req.user!.id,
        fixStart: new Date(),
        fixMinutes: fixMinutes ?? undefined
      }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId,
        actorId: req.user!.id,
        type: "BUG_LOGGED",
        field: "bugSeverity",
        fromValue: existing.bugSeverity ?? "",
        toValue: severity,
        description: `Bug logged during testing with ${severity.toLowerCase()} severity`
      }
    });

    if (eventType && delta) {
      await applyPointEvent({
        ticketId,
        userId: ticket.assigneeId,
        actorId: req.user!.id,
        eventType,
        delta,
        bugSeverity: severity,
        fixMinutes,
        notes: `${severity} bug reopened from testing`
      });
    }
  }

  await writeAuditLog({
    actorId: req.user!.id,
    action: "TICKET_UPDATED",
    entityType: "TICKET",
    entityId: ticket.id
  });

  res.json(mapTicket(ticket));
});

router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]), async (req, res) => {
  const ticketId = String(req.params.id);
  await prisma.ticket.delete({ where: { id: ticketId } });

  await writeAuditLog({
    actorId: req.user!.id,
    action: "TICKET_DELETED",
    entityType: "TICKET",
    entityId: ticketId
  });

  res.status(204).send();
});

router.get("/:id", async (req, res) => {
  const ticketId = String(req.params.id);
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      project: { select: { id: true, name: true, code: true } },
      assignee: { select: { id: true, name: true, role: true } },
      reporter: { select: { id: true, name: true, role: true } },
      checklistItems: true,
      comments: {
        include: {
          author: { select: { id: true, name: true, role: true } },
          attachments: true
        },
        orderBy: { createdAt: "desc" }
      },
      histories: {
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" }
      },
      timeLogs: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { loggedAt: "desc" }
      },
      dependenciesFrom: {
        include: { dependsOnTicket: { select: { id: true, ticketNumber: true, title: true, status: true } } }
      },
      attachments: true,
      bugs: {
        include: { reportedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" }
      },
      pointEvents: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.json({
    ...mapTicket(ticket),
    comments: ticket.comments.map((comment) => ({
      ...comment,
      mentions: fromDelimitedString(comment.mentions)
    }))
  });
});

router.post("/:id/comments", async (req, res) => {
  const ticketId = String(req.params.id);
  const body = commentSchema.parse(req.body);

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: req.user!.id,
      content: body.content,
      mentions: toDelimitedString(body.mentions)
    },
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actorId: req.user!.id,
      type: "COMMENTED",
      description: "Comment added"
    }
  });

  if (body.mentions.length) {
    await prisma.notification.createMany({
      data: body.mentions.map((userId) => ({
        userId,
        title: "Mentioned in ticket comment",
        body: comment.content.slice(0, 160)
      }))
    });
  }

  res.status(201).json({
    ...comment,
    mentions: body.mentions
  });
});

router.post("/:id/time-logs", async (req, res) => {
  const ticketId = String(req.params.id);
  const body = timeLogSchema.parse(req.body);

  const timeLog = await prisma.timeLog.create({
    data: {
      ticketId,
      userId: req.user!.id,
      hours: body.hours,
      description: body.description,
      workDate: body.workDate ? new Date(body.workDate) : new Date(),
      isBillable: body.isBillable
    },
    include: {
      user: { select: { id: true, name: true, role: true } }
    }
  });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      actualHours: {
        increment: body.hours
      }
    }
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actorId: req.user!.id,
      type: "TIME_LOGGED",
      description: `${body.hours} hours logged`
    }
  });

  res.status(201).json(timeLog);
});

export default router;
