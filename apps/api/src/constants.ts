export const ROLES = ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "DEVELOPER", "QA", "USER"] as const;
export const PROJECT_STATUSES = ["NOT_STARTED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const;
export const PROJECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "UNDER_REVIEW", "TESTING", "RESOLVED", "CLOSED"] as const;
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const BUG_SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"] as const;
export const POINT_EVENT_TYPES = ["on_time", "overdue", "bug_minor", "bug_major", "bug_critical", "manual_adjust"] as const;
export const HISTORY_TYPES = ["CREATED", "UPDATED", "STATUS_CHANGED", "ASSIGNED", "COMMENTED", "TIME_LOGGED", "ATTACHMENT_ADDED", "CHECKLIST_UPDATED", "POINT_AWARDED", "BUG_LOGGED"] as const;

export const TICKET_WORKFLOW: Record<string, readonly string[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["TESTING"],
  TESTING: ["RESOLVED", "IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: []
} as const;

export type Role = (typeof ROLES)[number];
