export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "TEAM_LEAD"
  | "DEVELOPER"
  | "QA"
  | "USER";

export type ProjectStatus = "NOT_STARTED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "UNDER_REVIEW" | "TESTING" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type BugSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ProjectSummary = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  clientName?: string | null;
  type?: string | null;
  priority: ProjectPriority;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  expectedDuration?: number | null;
  tags: string[];
  managerId?: string | null;
  manager?: { id: string; name: string; email: string } | null;
  members?: Array<{ id: string; roleLabel?: string | null; user: { id: string; name: string; role: Role } }>;
  _count?: { tickets: number };
};

export type TicketSummary = {
  id: string;
  projectId: string;
  ticketNumber: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  startDate?: string | null;
  endDate?: string | null;
  closedAt?: string | null;
  estimatedHours?: number | null;
  actualHours: number;
  tags: string[];
  watcherIds: string[];
  supportRequired: boolean;
  isBug: boolean;
  bugSeverity?: BugSeverity | null;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; role: Role } | null;
  reporterId?: string | null;
  reporter?: { id: string; name: string; role: Role } | null;
  project: { id: string; name: string; code: string };
  checklistItems?: Array<{ id: string; title: string; completed: boolean }>;
  pointEvents?: Array<{ id: string; eventType: string; delta: number; createdAt: string; notes?: string | null }>;
  _count?: { comments: number; timeLogs: number; bugs: number };
};

export type TicketDetail = TicketSummary & {
  comments: Array<{
    id: string;
    content: string;
    mentions: string[];
    createdAt: string;
    author: { id: string; name: string; role: Role };
  }>;
  histories: Array<{
    id: string;
    type: string;
    description?: string | null;
    fromValue?: string | null;
    toValue?: string | null;
    createdAt: string;
    actor: { id: string; name: string; role: Role };
  }>;
  timeLogs: Array<{
    id: string;
    hours: number;
    description?: string | null;
    workDate?: string | null;
    isBillable?: boolean;
    loggedAt: string;
    user: { id: string; name: string; role: Role };
  }>;
  bugs: Array<{
    id: string;
    severity: BugSeverity;
    fixMinutes?: number | null;
    createdAt: string;
    reportedBy: { id: string; name: string; role: Role };
  }>;
  pointEvents: Array<{
    id: string;
    eventType: string;
    delta: number;
    bugSeverity?: BugSeverity | null;
    fixMinutes?: number | null;
    notes?: string | null;
    createdAt: string;
  }>;
  dependenciesFrom: Array<{
    id: string;
    dependsOnTicket: { id: string; ticketNumber: string; title: string; status: TicketStatus };
  }>;
};

export type ReportOverview = {
  stats: {
    totalProjects: number;
    totalTickets: number;
    totalUsers: number;
    totalLoggedHours: number;
    overdueTickets: number;
    bugCount: number;
  };
  ticketsByStatus: Record<string, number>;
  projectCompletion: Array<{
    projectId: string;
    projectName: string;
    totalTickets: number;
    doneTickets: number;
    overdueTickets: number;
    completionRate: number;
  }>;
  leaderboard: Array<{
    id: string;
    name: string;
    role: Role;
    totalPoints: number;
  }>;
  pointsTrend: Array<{ date: string; delta: number }>;
};

export type UserReport = {
  id: string;
  name: string;
  role: Role;
  assignedTickets: number;
  loggedHours: number;
  totalPoints: number;
  onTime: number;
  overdue: number;
  bugMinor: number;
  bugMajor: number;
  bugCritical: number;
};

export type ProjectReport = {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  tickets: number;
  completedTickets: number;
  estimatedHours: number;
  actualHours: number;
  overdueTickets: number;
};

export type TaskReport = {
  id: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  project: { name: string; code: string };
  assignee: string | null;
  estimatedHours: number;
  actualHours: number;
  isBug: boolean;
  bugSeverity: BugSeverity | null;
};

export type BugAnalytics = {
  total: number;
  bySeverity: Record<string, number>;
  recent: Array<{
    id: string;
    severity: BugSeverity;
    fixMinutes?: number | null;
    createdAt: string;
    ticket: { id: string; ticketNumber: string; title: string; assigneeId?: string | null };
    reportedBy: { id: string; name: string; role: Role };
  }>;
  trend: Array<{ date: string; count: number }>;
};

export type TimelineReport = {
  dailyHours: Array<{ date: string; hours: number }>;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: TicketStatus;
    project: { id: string; name: string; code: string };
    hours: number;
    note: string;
    workDate: string;
  }>;
  totals: {
    loggedHours: number;
    estimatedHours: number;
    totalPoints: number;
  };
  bugs: Record<string, number>;
  pointEvents: Array<{
    id: string;
    eventType: string;
    delta: number;
    bugSeverity?: BugSeverity | null;
    createdAt: string;
    notes?: string | null;
  }>;
};
