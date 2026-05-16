import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@example.com",
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN"
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      name: "Project Manager",
      email: "manager@example.com",
      passwordHash,
      role: "PROJECT_MANAGER"
    }
  });

  await prisma.user.upsert({
    where: { email: "lead@example.com" },
    update: {},
    create: {
      name: "Team Lead",
      email: "lead@example.com",
      passwordHash,
      role: "TEAM_LEAD"
    }
  });

  const developer = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      name: "Developer",
      email: "dev@example.com",
      passwordHash,
      role: "DEVELOPER"
    }
  });

  await prisma.user.upsert({
    where: { email: "qa@example.com" },
    update: {},
    create: {
      name: "QA User",
      email: "qa@example.com",
      passwordHash,
      role: "QA"
    }
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "End User",
      email: "user@example.com",
      passwordHash,
      role: "USER"
    }
  });

  const project = await prisma.project.upsert({
    where: { code: "PRJ-001" },
    update: {},
    create: {
      code: "PRJ-001",
      name: "Ticket Management Platform",
      description: "Initial scoped delivery for the management system.",
      clientName: "Internal",
      type: "Web Application",
      priority: "HIGH",
      status: "ACTIVE",
      tags: "ticketing,react,node",
      managerId: manager.id
    }
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: manager.id } },
    update: {},
    create: { projectId: project.id, userId: manager.id, roleLabel: "Manager" }
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: developer.id } },
    update: {},
    create: { projectId: project.id, userId: developer.id, roleLabel: "Developer" }
  });

  await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-1001" },
    update: {},
    create: {
      sequence: 1001,
      ticketNumber: "TKT-1001",
      projectId: project.id,
      title: "Build project dashboard",
      description: "Create dashboard cards and charts for active metrics.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assigneeId: developer.id,
      reporterId: manager.id,
      estimatedHours: 16,
      tags: "dashboard,analytics"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.id,
      action: "SEED_COMPLETED",
      entityType: "SYSTEM",
      entityId: "bootstrap",
      metadata: JSON.stringify({ seededAt: new Date().toISOString() })
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
