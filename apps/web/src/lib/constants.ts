import type { ProjectPriority, ProjectStatus, TicketPriority, TicketStatus } from "../types";

export const projectStatuses: ProjectStatus[] = ["NOT_STARTED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];
export const projectPriorities: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const ticketStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "UNDER_REVIEW", "TESTING", "RESOLVED", "CLOSED"];
export const ticketPriorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const bugSeverities = ["MINOR", "MAJOR", "CRITICAL"] as const;
