var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  enhancedTasks: () => enhancedTasks,
  goals: () => goals,
  habitEntries: () => habitEntries,
  habits: () => habits,
  insertGoalSchema: () => insertGoalSchema,
  insertHabitEntrySchema: () => insertHabitEntrySchema,
  insertHabitSchema: () => insertHabitSchema,
  insertMilestoneSchema: () => insertMilestoneSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPomodoroSessionSchema: () => insertPomodoroSessionSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertTaskTimeEntrySchema: () => insertTaskTimeEntrySchema,
  insertTeamInvitationSchema: () => insertTeamInvitationSchema,
  insertTeamMemberSchema: () => insertTeamMemberSchema,
  insertTeamSchema: () => insertTeamSchema,
  insertUserSchema: () => insertUserSchema,
  milestones: () => milestones,
  notifications: () => notifications,
  pomodoroSessions: () => pomodoroSessions,
  taskTimeEntries: () => taskTimeEntries,
  tasks: () => tasks,
  teamInvitations: () => teamInvitations,
  teamMembers: () => teamMembers,
  teams: () => teams,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("proposed"),
  dayOfWeek: text("day_of_week").notNull(),
  // "monday", "tuesday", etc.
  weekKey: text("week_key").notNull(),
  // "2025-01-20" (Monday of the week)
  originalWeek: text("original_week"),
  // Track which week the task was originally created in
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  category: text("category"),
  streakGoal: integer("streak_goal").default(7).notNull(),
  // Days needed for achievement
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var habitEntries = pgTable("habit_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  habitId: integer("habit_id").notNull(),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  duration: integer("duration").notNull(),
  // in seconds
  type: text("type").notNull().default("focus"),
  // "focus", "short_break", "long_break"
  completedAt: timestamp("completed_at").defaultNow().notNull()
});
var teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  // "owner", "admin", "member", "viewer"
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull()
});
var teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  invitedBy: integer("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  // "pending", "accepted", "declined"
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull()
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true
});
var insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true
});
var insertHabitEntrySchema = createInsertSchema(habitEntries).omit({
  id: true,
  createdAt: true
});
var insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
  completedAt: true
});
var insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
  lastActive: true
});
var insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({
  id: true,
  sentAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0),
  unit: text("unit").notNull(),
  deadline: text("deadline").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow()
});
var milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetValue: integer("target_value").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at")
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("medium"),
  read: boolean("read").default(false),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow()
});
var taskTimeEntries = pgTable("task_time_entries", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  description: text("description")
});
var enhancedTasks = pgTable("enhanced_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("proposed"),
  dayOfWeek: text("day_of_week").notNull(),
  notes: text("notes"),
  estimatedTime: integer("estimated_time"),
  // in minutes
  actualTime: integer("actual_time"),
  // in minutes
  subtasks: text("subtasks").array(),
  dependencies: integer("dependencies").array(),
  isTemplate: boolean("is_template").default(false),
  templateId: integer("template_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true
});
var insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});
var insertTaskTimeEntrySchema = createInsertSchema(taskTimeEntries).omit({
  id: true
});

// server/db.ts
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// server/storage.ts
import { eq, and, ne, lt } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.initializeDefaultData();
  }
  async initializeDefaultData() {
    try {
      const existingHabits = await this.getHabits(1);
      if (existingHabits.length === 0) {
        const defaultHabits = [
          { name: "Drink Water", icon: "fas fa-tint", color: "blue-500" },
          { name: "Workout", icon: "fas fa-dumbbell", color: "green-500" },
          { name: "Read", icon: "fas fa-book", color: "purple-500" },
          { name: "Meditate", icon: "fas fa-leaf", color: "green-600" }
        ];
        for (const habit of defaultHabits) {
          await this.createHabit({ ...habit, userId: 1 });
        }
      }
    } catch (error) {
      console.log("Database tables not yet created, will initialize on first push");
    }
  }
  // Tasks - User-specific
  async getTasks(userId) {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }
  async getTask(id, userId) {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }
  async createTask(insertTask) {
    console.log("Creating task in storage:", insertTask);
    const [task] = await db.insert(tasks).values(insertTask).returning();
    console.log("Task created in database:", task);
    return task;
  }
  async updateTask(id, userId, updates) {
    const [task] = await db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    return task;
  }
  async deleteTask(id, userId) {
    const result = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
  async getTasksByWeek(userId, weekKey) {
    return await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.weekKey, weekKey)));
  }
  async getIncompleteTasksForCarryForward(userId, currentWeekKey) {
    return await db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        lt(tasks.weekKey, currentWeekKey),
        // Get tasks from weeks BEFORE the target week
        ne(tasks.status, "completed")
      )
    );
  }
  async carryForwardTasks(userId, fromWeekKey, toWeekKey) {
    const incompleteTasks = await this.getIncompleteTasksForCarryForward(userId, toWeekKey);
    const carriedTasks = [];
    for (const task of incompleteTasks) {
      const updatedTask = await this.updateTask(task.id, userId, {
        weekKey: toWeekKey,
        originalWeek: task.originalWeek || task.weekKey
        // Track original week
      });
      carriedTasks.push(updatedTask);
    }
    return carriedTasks;
  }
  // Habits - User-specific
  async getHabits(userId) {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }
  async createHabit(insertHabit) {
    const [habit] = await db.insert(habits).values(insertHabit).returning();
    return habit;
  }
  async updateHabit(id, userId, updates) {
    const [habit] = await db.update(habits).set(updates).where(and(eq(habits.id, id), eq(habits.userId, userId))).returning();
    if (!habit) {
      throw new Error(`Habit with id ${id} not found`);
    }
    return habit;
  }
  async deleteHabit(id, userId) {
    const result = await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
  // Habit Entries - User-specific
  async getHabitEntries(userId, habitId, date) {
    let conditions = [eq(habitEntries.userId, userId)];
    if (habitId) {
      conditions.push(eq(habitEntries.habitId, habitId));
    }
    if (date) {
      conditions.push(eq(habitEntries.date, date));
    }
    return await db.select().from(habitEntries).where(and(...conditions));
  }
  async createHabitEntry(insertEntry) {
    const [entry] = await db.insert(habitEntries).values(insertEntry).returning();
    return entry;
  }
  async updateHabitEntry(id, userId, updates) {
    const [entry] = await db.update(habitEntries).set(updates).where(and(eq(habitEntries.id, id), eq(habitEntries.userId, userId))).returning();
    if (!entry) {
      throw new Error(`Habit entry with id ${id} not found`);
    }
    return entry;
  }
  async toggleHabitEntry(habitId, date, userId) {
    const existingEntries = await this.getHabitEntries(userId, habitId, date);
    const existingEntry = existingEntries[0];
    if (existingEntry) {
      return this.updateHabitEntry(existingEntry.id, userId, { completed: !existingEntry.completed });
    } else {
      return this.createHabitEntry({ habitId, date, completed: true, userId });
    }
  }
  // Pomodoro Sessions - User-specific
  async getPomodoroSessions(userId) {
    return await db.select().from(pomodoroSessions).where(eq(pomodoroSessions.userId, userId));
  }
  async createPomodoroSession(insertSession) {
    const [session] = await db.insert(pomodoroSessions).values(insertSession).returning();
    return session;
  }
  async resetAllUserData(userId) {
    try {
      await db.delete(pomodoroSessions).where(eq(pomodoroSessions.userId, userId));
      await db.delete(habitEntries).where(eq(habitEntries.userId, userId));
      await db.delete(habits).where(eq(habits.userId, userId));
      await db.delete(tasks).where(eq(tasks.userId, userId));
      return true;
    } catch (error) {
      console.error("Error resetting user data:", error);
      return false;
    }
  }
  // Users
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async verifyUser(email) {
    const [user] = await db.update(users).set({ isVerified: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.email, email)).returning();
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    return user;
  }
  // Team Collaboration Methods
  async getTeamByUserId(userId) {
    const membershipResult = await db.select().from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, userId)).limit(1);
    return membershipResult[0]?.teams;
  }
  async createTeam(team) {
    const result = await db.insert(teams).values(team).returning();
    await this.addTeamMember({
      teamId: result[0].id,
      userId: team.ownerId,
      role: "owner"
    });
    return result[0];
  }
  async getTeamMembers(teamId) {
    const result = await db.select({
      id: teamMembers.id,
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      lastActive: teamMembers.lastActive,
      name: users.name,
      email: users.email
    }).from(teamMembers).innerJoin(users, eq(teamMembers.userId, users.id)).where(eq(teamMembers.teamId, teamId));
    return result;
  }
  async getTeamMembersByUserId(userId) {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    return result;
  }
  async addTeamMember(member) {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }
  async removeTeamMember(teamId, userId) {
    const result = await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  async getTeamInvitations(teamId) {
    const result = await db.select({
      id: teamInvitations.id,
      teamId: teamInvitations.teamId,
      email: teamInvitations.email,
      role: teamInvitations.role,
      invitedBy: teamInvitations.invitedBy,
      status: teamInvitations.status,
      sentAt: teamInvitations.sentAt,
      expiresAt: teamInvitations.expiresAt,
      inviterName: users.name
    }).from(teamInvitations).innerJoin(users, eq(teamInvitations.invitedBy, users.id)).where(eq(teamInvitations.teamId, teamId));
    return result;
  }
  async getTeamInvitationsByUserId(userId) {
    const result = await db.select().from(teamInvitations).where(eq(teamInvitations.invitedBy, userId));
    return result;
  }
  async createTeamInvitation(invitation) {
    const result = await db.insert(teamInvitations).values(invitation).returning();
    return result[0];
  }
  async updateTeamInvitationStatus(id, status) {
    const result = await db.update(teamInvitations).set({ status }).where(eq(teamInvitations.id, id)).returning();
    if (!result[0]) {
      throw new Error("Team invitation not found");
    }
    return result[0];
  }
  async getTeamInvitationById(id) {
    const result = await db.select().from(teamInvitations).where(eq(teamInvitations.id, id));
    return result[0];
  }
  async deleteTeamInvitation(id) {
    const result = await db.delete(teamInvitations).where(eq(teamInvitations.id, id)).returning();
    return result.length > 0;
  }
  async getTeamMemberById(id) {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return result[0];
  }
  async updateTeamMemberRole(memberId, role) {
    const result = await db.update(teamMembers).set({ role }).where(eq(teamMembers.id, memberId)).returning();
    if (!result[0]) {
      throw new Error("Team member not found");
    }
    return result[0];
  }
  async getTeamMemberByUserAndTeam(userId, teamId) {
    const result = await db.select().from(teamMembers).where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
    return result[0];
  }
};
var storage = new DatabaseStorage();

// server/authRoutes.ts
import { Router } from "express";
import { body, validationResult } from "express-validator";

// server/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// server/email.ts
import { Resend } from "resend";
var VERIFIED_SENDER = process.env.VERIFIED_SENDER_EMAIL || "delivered@resend.dev";
var DOMAIN = process.env.EMAIL_DOMAIN || "resend.dev";
var resend = null;
if (!process.env.RESEND_API_KEY) {
  console.warn("\u26A0\uFE0F RESEND_API_KEY not found. Email functionality will be disabled.");
  console.warn("\u{1F4E7} In development mode, emails will be logged to console instead.");
} else {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("\u2705 Resend initialized with verified sender:", VERIFIED_SENDER);
}
function getDisplayFromAddress(type) {
  const addresses = {
    noreply: `Productivity Hub <${VERIFIED_SENDER}>`,
    welcome: `Productivity Hub Welcome <${VERIFIED_SENDER}>`,
    support: `Productivity Hub Support <${VERIFIED_SENDER}>`,
    team: `Productivity Hub Teams <${VERIFIED_SENDER}>`
  };
  return addresses[type];
}
async function sendEmail(emailData) {
  if (!resend) {
    console.log("\u{1F4E7} DEVELOPMENT MODE: Email would be sent");
    console.log("   To:", emailData.to);
    console.log("   From:", emailData.from);
    console.log("   Subject:", emailData.subject);
    console.log("   Content:", emailData.text || emailData.html?.substring(0, 200) + "...");
    return true;
  }
  try {
    let fromAddress;
    if (emailData.from.includes("<") && emailData.from.includes(">")) {
      const displayName = emailData.from.split("<")[0].trim();
      fromAddress = `${displayName} <${VERIFIED_SENDER}>`;
    } else {
      fromAddress = `Productivity Hub <${VERIFIED_SENDER}>`;
    }
    console.log("Attempting to send email via Resend:", {
      to: emailData.to,
      from: fromAddress,
      subject: emailData.subject
    });
    const emailPayload = {
      from: fromAddress,
      to: emailData.to,
      subject: emailData.subject
    };
    if (emailData.html) {
      emailPayload.html = emailData.html;
    } else if (emailData.text) {
      emailPayload.text = emailData.text;
    } else {
      emailPayload.text = "This is a notification from Productivity Hub.";
    }
    const result = await resend.emails.send(emailPayload);
    if (result.error) {
      console.error("\u274C Resend API error:", result.error);
      return false;
    }
    console.log("\u2705 Email sent successfully via Resend to:", emailData.to, "ID:", result.data?.id);
    return true;
  } catch (error) {
    console.error("\u274C Failed to send email via Resend:", error);
    console.log("\u26A0\uFE0F Continuing without email verification due to Resend error");
    return false;
  }
}

// server/auth.ts
var JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
var FRONTEND_URL = process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function generateVerificationToken(email) {
  return jwt.sign({ email, type: "verification" }, JWT_SECRET, { expiresIn: "24h" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
async function sendVerificationEmail(email, name) {
  const token = generateVerificationToken(email);
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  const emailContent = {
    to: email,
    from: getDisplayFromAddress("noreply"),
    subject: "Welcome to Productivity Hub - Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Productivity Hub</h1>
          <p style="color: #64748b; margin: 5px 0;">Your Personal Productivity Platform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">Welcome to Productivity Hub, ${name}!</h2>
          <p style="color: #e0e7ff; margin: 0;">Thank you for joining our community of productivity enthusiasts.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">Verify Your Email Address</h3>
          <p style="color: #475569; margin: 0 0 20px 0;">
            To get started with your productivity journey, please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="color: #1e293b; margin: 0 0 10px 0;">What's Next?</h4>
          <ul style="color: #475569; margin: 0; padding-left: 20px;">
            <li>Set up your first productivity goals</li>
            <li>Create daily habits to track</li>
            <li>Organize tasks with our Kanban boards</li>
            <li>Use the Pomodoro timer for focused work</li>
            <li>Invite team members to collaborate</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>If you didn't create this account, please ignore this email.</p>
          <p>This verification link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>\xA9 2025 Productivity Hub. Built for modern professionals.</p>
        </div>
      </div>
    `
  };
  return await sendEmail(emailContent);
}
async function sendWelcomeEmail(email, name) {
  const emailContent = {
    to: email,
    from: getDisplayFromAddress("welcome"),
    subject: "\u{1F389} Welcome to Productivity Hub - Let's Get Started!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">\u{1F389} Welcome Aboard, ${name}!</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">Your Account is Ready!</h2>
          <p style="color: #e0f2fe; margin: 0;">Start building better productivity habits today.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">Quick Start Guide</h3>
          <div style="margin-bottom: 15px;">
            <h4 style="color: #3b82f6; margin: 0 0 5px 0;">1. Create Your First Task</h4>
            <p style="color: #475569; margin: 0;">Use our Kanban board to organize your work into clear, actionable tasks.</p>
          </div>
          <div style="margin-bottom: 15px;">
            <h4 style="color: #8b5cf6; margin: 0 0 5px 0;">2. Set Up Daily Habits</h4>
            <p style="color: #475569; margin: 0;">Track daily habits and build consistent routines for long-term success.</p>
          </div>
          <div>
            <h4 style="color: #f59e0b; margin: 0 0 5px 0;">3. Start a Focus Session</h4>
            <p style="color: #475569; margin: 0;">Use our built-in Pomodoro timer for distraction-free work periods.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${FRONTEND_URL}" 
             style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Launch Productivity Hub
          </a>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>Need help? Reply to this email and our team will assist you.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>\xA9 2025 Productivity Hub. Empowering productivity, one task at a time.</p>
        </div>
      </div>
    `
  };
  return await sendEmail(emailContent);
}

// server/authRoutes.ts
var router = Router();
router.post("/register", [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, name } = req.body;
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      isVerified: false
    });
    const emailSent = await sendVerificationEmail(email, name);
    if (!emailSent) {
      console.warn("Failed to send verification email to:", email);
      console.log("\u26A0\uFE0F Auto-verifying user due to email failure");
      await storage.verifyUser(email);
      const updatedUser = await storage.getUserByEmail(email);
      if (updatedUser) {
        user.isVerified = updatedUser.isVerified;
      }
    }
    const token = generateToken({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    });
    const message = user.isVerified ? "Account created and verified successfully! You can now use the platform." : "Account created successfully! Please check your email to verify your account before logging in.";
    res.status(201).json({
      message,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    });
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/verify-email", [
  body("token").exists()
], async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== "verification") {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }
    const user = await storage.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.json({ message: "Email already verified" });
    }
    await storage.updateUser(user.id, { isVerified: true });
    await sendWelcomeEmail(user.email, user.name);
    const newToken = generateToken({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      isVerified: true
    });
    res.json({
      message: "Email verified successfully",
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: true
      }
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await storage.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});
var authRoutes_default = router;

// server/middleware.ts
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  req.user = {
    id: parseInt(decoded.id),
    email: decoded.email,
    name: decoded.name,
    isVerified: decoded.isVerified
  };
  next();
};

// server/routes.ts
import { z } from "zod";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/backup.ts
async function createDataBackup(userId) {
  try {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const user = await storage.getUserById(userId);
    const tasks2 = await storage.getTasks(userId);
    const habits2 = await storage.getHabits(userId);
    const habitEntries2 = await storage.getHabitEntries(userId);
    const pomodoroSessions2 = await storage.getPomodoroSessions(userId);
    const backupData = {
      timestamp: timestamp2,
      users: user ? [user] : [],
      tasks: tasks2,
      habits: habits2,
      habitEntries: habitEntries2,
      pomodoroSessions: pomodoroSessions2,
      goals: [],
      // Add goals when implemented
      metadata: {
        version: "1.0.0",
        totalRecords: tasks2.length + habits2.length + habitEntries2.length + pomodoroSessions2.length
      }
    };
    return backupData;
  } catch (error) {
    console.error("Backup creation failed:", error);
    throw new Error("Failed to create backup");
  }
}
async function exportUserData(userId) {
  const backup = await createDataBackup(userId);
  const filename = `productivity_backup_${userId}_${backup.timestamp.split("T")[0]}.json`;
  return JSON.stringify(backup, null, 2);
}

// server/routes.ts
import archiver from "archiver";
import * as XLSX from "xlsx";
function convertToCSV(data) {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || "";
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}
function createExcelWorkbook(data, userId) {
  const workbook = XLSX.utils.book_new();
  const summaryData = [
    ["Productivity Hub Data Export"],
    [""],
    ["Export Date:", (/* @__PURE__ */ new Date()).toISOString().split("T")[0]],
    ["User ID:", userId],
    [""],
    ["Data Summary:"],
    ["Tasks:", data.tasks?.length || 0],
    ["Habits:", data.habits?.length || 0],
    ["Habit Entries:", data.habitEntries?.length || 0],
    ["Pomodoro Sessions:", data.pomodoroSessions?.length || 0],
    [""],
    ["Sheet Overview:"],
    ["\u2022 Tasks - All your tasks and their details"],
    ["\u2022 Habits - Your habit definitions and settings"],
    ["\u2022 Habit Entries - Daily habit completion records"],
    ["\u2022 Pomodoro Sessions - Focus session history"],
    ["\u2022 Statistics - Data analysis and insights"]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ width: 25 }, { width: 30 }];
  summarySheet["A1"] = { v: "Productivity Hub Data Export", t: "s", s: { font: { bold: true, sz: 16 } } };
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  if (data.tasks && data.tasks.length > 0) {
    const taskHeaders = ["ID", "Title", "Category", "Priority", "Status", "Day of Week", "Week", "Notes", "Created Date"];
    const taskData = data.tasks.map((task) => [
      task.id,
      task.title,
      task.category,
      task.priority,
      task.status,
      task.dayOfWeek,
      task.weekKey,
      task.notes || "",
      new Date(task.createdAt).toLocaleDateString()
    ]);
    const tasksSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskData]);
    tasksSheet["!cols"] = [
      { width: 8 },
      { width: 25 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 30 },
      { width: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");
  }
  if (data.habits && data.habits.length > 0) {
    const habitHeaders = ["ID", "Name", "Icon", "Color", "Category", "Schedule", "Created Date"];
    const habitData = data.habits.map((habit) => [
      habit.id,
      habit.name,
      habit.icon || "",
      habit.color || "",
      habit.category || "",
      habit.schedule || "daily",
      new Date(habit.createdAt).toLocaleDateString()
    ]);
    const habitsSheet = XLSX.utils.aoa_to_sheet([habitHeaders, ...habitData]);
    habitsSheet["!cols"] = [
      { width: 8 },
      { width: 20 },
      { width: 8 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, habitsSheet, "Habits");
  }
  if (data.habitEntries && data.habitEntries.length > 0) {
    const entryHeaders = ["ID", "Habit ID", "Date", "Completed", "Notes"];
    const entryData = data.habitEntries.map((entry) => [
      entry.id,
      entry.habitId,
      entry.date,
      entry.completed ? "Yes" : "No",
      entry.notes || ""
    ]);
    const entriesSheet = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryData]);
    entriesSheet["!cols"] = [
      { width: 8 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, entriesSheet, "Habit Entries");
  }
  if (data.pomodoroSessions && data.pomodoroSessions.length > 0) {
    const sessionHeaders = ["ID", "Type", "Duration (min)", "Started At", "Completed At", "Task", "Notes"];
    const sessionData = data.pomodoroSessions.map((session) => [
      session.id,
      session.type,
      session.duration,
      new Date(session.startedAt).toLocaleString(),
      session.completedAt ? new Date(session.completedAt).toLocaleString() : "Not completed",
      session.taskTitle || "",
      session.notes || ""
    ]);
    const sessionsSheet = XLSX.utils.aoa_to_sheet([sessionHeaders, ...sessionData]);
    sessionsSheet["!cols"] = [
      { width: 8 },
      { width: 12 },
      { width: 15 },
      { width: 20 },
      { width: 20 },
      { width: 25 },
      { width: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, sessionsSheet, "Pomodoro Sessions");
  }
  const statsData = [
    ["Productivity Statistics"],
    [""],
    ["Task Statistics:"],
    ["Total Tasks:", data.tasks?.length || 0],
    ["Completed Tasks:", data.tasks?.filter((t) => t.status === "completed").length || 0],
    ["In Progress Tasks:", data.tasks?.filter((t) => t.status === "in-progress").length || 0],
    [""],
    ["Habit Statistics:"],
    ["Total Habits:", data.habits?.length || 0],
    ["Total Habit Entries:", data.habitEntries?.length || 0],
    ["Completed Entries:", data.habitEntries?.filter((e) => e.completed).length || 0],
    ["Completion Rate:", data.habitEntries?.length ? `${Math.round(data.habitEntries.filter((e) => e.completed).length / data.habitEntries.length * 100)}%` : "0%"],
    [""],
    ["Focus Statistics:"],
    ["Total Pomodoro Sessions:", data.pomodoroSessions?.length || 0],
    ["Completed Sessions:", data.pomodoroSessions?.filter((s) => s.completedAt).length || 0],
    ["Total Focus Time (min):", data.pomodoroSessions?.reduce((sum, s) => s.completedAt ? sum + s.duration : sum, 0) || 0]
  ];
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet["!cols"] = [{ width: 25 }, { width: 20 }];
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistics");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
async function sendTeamInvitationEmail(email, inviterName, role) {
  const FRONTEND_URL2 = process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
  const emailContent = {
    to: email,
    from: getDisplayFromAddress("team"),
    subject: `${inviterName} invited you to join their Productivity Hub team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Productivity Hub</h1>
          <p style="color: #64748b; margin: 5px 0;">Team Collaboration Platform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">You're Invited to Join a Team!</h2>
          <p style="color: #e0e7ff; margin: 0;">${inviterName} has invited you to collaborate on their productivity goals.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">Team Invitation Details</h3>
          <p style="color: #475569; margin: 0 0 10px 0;"><strong>Inviter:</strong> ${inviterName}</p>
          <p style="color: #475569; margin: 0 0 20px 0;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
          <p style="color: #475569; margin: 0 0 20px 0;">
            Join their team to collaborate on tasks, share habits, and achieve productivity goals together.
          </p>
          <div style="text-align: center;">
            <a href="${FRONTEND_URL2}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="color: #1e293b; margin: 0 0 10px 0;">What You Can Do:</h4>
          <ul style="color: #475569; margin: 0; padding-left: 20px;">
            <li>Collaborate on shared tasks and projects</li>
            <li>Track team productivity metrics</li>
            <li>Share habits and motivation</li>
            <li>Use collaborative planning tools</li>
            <li>Join team focus sessions</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>If you don't want to join this team, you can safely ignore this email.</p>
          <p>This invitation will expire in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>\xA9 2025 Productivity Hub. Built for modern teams.</p>
        </div>
      </div>
    `
  };
  return await sendEmail(emailContent);
}
async function sendInvitationCancellationEmail(email, cancelledBy) {
  const FRONTEND_URL2 = process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
  const emailContent = {
    to: email,
    from: getDisplayFromAddress("noreply"),
    subject: `Team invitation cancelled - Productivity Hub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Productivity Hub</h1>
          <p style="color: #64748b; margin: 5px 0;">Team Collaboration Platform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #64748b, #94a3b8); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">Team Invitation Cancelled</h2>
          <p style="color: #f1f5f9; margin: 0;">Your team invitation has been cancelled by ${cancelledBy}.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">What This Means</h3>
          <p style="color: #475569; margin: 0 0 15px 0;">
            The team invitation that was previously sent to you is no longer valid. You will not be able to join the team using the previous invitation link.
          </p>
          <p style="color: #475569; margin: 0 0 20px 0;">
            If this was done in error, please contact ${cancelledBy} directly to request a new invitation.
          </p>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="color: #1e293b; margin: 0 0 10px 0;">Want to Join a Different Team?</h4>
          <p style="color: #475569; margin: 0 0 15px 0;">
            You can still create your own productivity workspace or join other teams with valid invitations.
          </p>
          <div style="text-align: center;">
            <a href="${FRONTEND_URL2}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
              Visit Productivity Hub
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>If you have any questions, please contact the team administrator.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>\xA9 2025 Productivity Hub. Built for modern teams.</p>
        </div>
      </div>
    `
  };
  return await sendEmail(emailContent);
}
async function registerRoutes(app2) {
  app2.use("/api/auth", authRoutes_default);
  app2.get("/api/export/excel", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const backupData = await exportUserData(userId);
      const parsedData = JSON.parse(backupData);
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const excelBuffer = createExcelWorkbook(parsedData, userId);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="productivity_export_${userId}_${timestamp2}.xlsx"`);
      res.setHeader("Content-Length", excelBuffer.length.toString());
      res.send(excelBuffer);
    } catch (error) {
      console.error("Excel export failed:", error);
      res.status(500).json({ message: "Failed to create Excel export" });
    }
  });
  app2.get("/api/export/data", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const backupData = await exportUserData(userId);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="productivity_backup_${userId}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
      res.send(backupData);
    } catch (error) {
      console.error("Export failed:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });
  app2.get("/api/backup/create", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const backup = await createDataBackup(userId);
      res.json({
        message: "Backup created successfully",
        backup,
        timestamp: backup.timestamp,
        totalRecords: backup.metadata.totalRecords
      });
    } catch (error) {
      console.error("Backup creation failed:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });
  app2.get("/api/export/zip", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const backupData = await exportUserData(userId);
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="productivity_backup_${userId}_${timestamp2}.zip"`);
      const archive = archiver("zip", {
        zlib: { level: 9 }
        // Maximum compression
      });
      archive.pipe(res);
      archive.append(JSON.stringify(backupData, null, 2), {
        name: `productivity_backup_${timestamp2}.json`
      });
      const backup = JSON.parse(backupData);
      if (backup.tasks && backup.tasks.length > 0) {
        const tasksCsv = convertToCSV(backup.tasks);
        archive.append(tasksCsv, { name: "tasks.csv" });
      }
      if (backup.habits && backup.habits.length > 0) {
        const habitsCsv = convertToCSV(backup.habits);
        archive.append(habitsCsv, { name: "habits.csv" });
      }
      if (backup.habitEntries && backup.habitEntries.length > 0) {
        const habitEntriesCsv = convertToCSV(backup.habitEntries);
        archive.append(habitEntriesCsv, { name: "habit_entries.csv" });
      }
      if (backup.pomodoroSessions && backup.pomodoroSessions.length > 0) {
        const pomodoroSessionsCsv = convertToCSV(backup.pomodoroSessions);
        archive.append(pomodoroSessionsCsv, { name: "pomodoro_sessions.csv" });
      }
      const readme = `Productivity Hub Data Export
============================

Export Date: ${(/* @__PURE__ */ new Date()).toISOString()}
User ID: ${userId}

Files Included:
- productivity_backup_${timestamp2}.json: Complete data backup in JSON format
- tasks.csv: All your tasks and their details
- habits.csv: Your habit definitions and settings
- habit_entries.csv: Daily habit completion records
- pomodoro_sessions.csv: Focus session history

This export contains all your productivity data for backup and analysis purposes.
You can import this data back into Productivity Hub or use it with other tools.

For support, contact: support@productivityhub.com
`;
      archive.append(readme, { name: "README.txt" });
      await archive.finalize();
    } catch (error) {
      console.error("ZIP export failed:", error);
      res.status(500).json({ message: "Failed to create ZIP export" });
    }
  });
  app2.post("/api/tasks/carry-forward", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { fromWeekKey, toWeekKey } = req.body;
      if (!fromWeekKey || !toWeekKey) {
        return res.status(400).json({ message: "fromWeekKey and toWeekKey are required" });
      }
      const carriedTasks = await storage.carryForwardTasks(userId, fromWeekKey, toWeekKey);
      res.json({
        message: `${carriedTasks.length} tasks carried forward to next week`,
        carriedTasks: carriedTasks.length,
        tasks: carriedTasks
      });
    } catch (error) {
      console.error("Error carrying forward tasks:", error);
      res.status(500).json({ message: "Failed to carry forward tasks" });
    }
  });
  app2.get("/api/tasks/week/:weekKey", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { weekKey } = req.params;
      const tasks2 = await storage.getTasksByWeek(userId, weekKey);
      res.json(tasks2);
    } catch (error) {
      console.error("Error fetching tasks by week:", error);
      res.status(500).json({ message: "Failed to fetch tasks for week" });
    }
  });
  app2.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const tasks2 = await storage.getTasks(userId);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("Task creation request body:", req.body);
      console.log("User ID:", userId);
      const taskData = {
        ...req.body,
        userId
      };
      console.log("Task data with userId:", taskData);
      const task = insertTaskSchema.parse(taskData);
      console.log("Parsed task data:", task);
      const createdTask = await storage.createTask(task);
      console.log("Created task:", createdTask);
      res.json(createdTask);
    } catch (error) {
      console.error("Task creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task", error: error?.message || "Unknown error" });
      }
    }
  });
  app2.put("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = insertTaskSchema.partial().parse(req.body);
      const existingTask = await storage.getTask(id, userId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      const updatedTask = await storage.updateTask(id, userId, updates);
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });
  app2.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const deleted = await storage.deleteTask(id, userId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.get("/api/habits", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const habits2 = await storage.getHabits(userId);
      res.json(habits2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });
  app2.post("/api/habits", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const habit = insertHabitSchema.parse({ ...req.body, userId });
      const createdHabit = await storage.createHabit(habit);
      res.json(createdHabit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create habit" });
      }
    }
  });
  app2.put("/api/habits/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = insertHabitSchema.partial().parse(req.body);
      const updatedHabit = await storage.updateHabit(id, userId, updates);
      res.json(updatedHabit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid habit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update habit" });
      }
    }
  });
  app2.delete("/api/habits/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const deleted = await storage.deleteHabit(id, userId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Habit not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });
  app2.get("/api/habit-entries", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const habitId = req.query.habitId ? parseInt(req.query.habitId) : void 0;
      const date = req.query.date;
      const entries = await storage.getHabitEntries(userId, habitId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit entries" });
    }
  });
  app2.post("/api/habit-entries/toggle", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { habitId, date } = req.body;
      const entry = await storage.toggleHabitEntry(habitId, date, userId);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle habit entry" });
    }
  });
  app2.get("/api/pomodoro-sessions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const sessions = await storage.getPomodoroSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pomodoro sessions" });
    }
  });
  app2.post("/api/pomodoro-sessions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const session = insertPomodoroSessionSchema.parse({ ...req.body, userId });
      const createdSession = await storage.createPomodoroSession(session);
      res.json(createdSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });
  app2.get("/api/goals", async (req, res) => {
    try {
      const goals2 = [
        {
          id: 1,
          title: "Complete 100 Pomodoro Sessions",
          description: "Improve focus and productivity",
          category: "Productivity",
          targetValue: 100,
          currentValue: 23,
          unit: "sessions",
          deadline: "2025-12-31",
          priority: "high",
          status: "active",
          createdAt: "2025-01-01"
        }
      ];
      res.json(goals2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });
  app2.post("/api/goals", async (req, res) => {
    try {
      const goal = { id: Date.now(), ...req.body, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to create goal" });
    }
  });
  app2.get("/api/notifications", async (req, res) => {
    try {
      const notifications2 = [];
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/analytics/productivity", async (req, res) => {
    try {
      const analytics = {
        tasksCompleted: 15,
        habitsCompleted: 42,
        pomodoroSessions: 28,
        productivityScore: 85
      };
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/team/members", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        const newTeam = await storage.createTeam({
          name: `${req.user.name}'s Team`,
          description: "Personal productivity workspace",
          ownerId: userId
        });
        const members2 = await storage.getTeamMembers(newTeam.id);
        return res.json(members2);
      }
      const members = await storage.getTeamMembers(team.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });
  app2.get("/api/team/invitations", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.json([]);
      }
      const invitations = await storage.getTeamInvitations(team.id);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching team invitations:", error);
      res.status(500).json({ message: "Failed to fetch team invitations" });
    }
  });
  app2.post("/api/team/invite", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { email, role, inviterName } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const invitation = await storage.createTeamInvitation({
        teamId: team.id,
        email,
        role: role || "member",
        invitedBy: userId,
        expiresAt
      });
      try {
        const emailSent = await sendTeamInvitationEmail(email, inviterName || "Team Member", role || "member");
        if (emailSent) {
          console.log("\u2705 Team invitation email sent successfully to:", email);
        } else {
          console.log("\u26A0\uFE0F Team invitation email failed to send to:", email, "(continuing without email)");
        }
      } catch (emailError) {
        console.error("\u274C Failed to send team invitation email:", emailError);
        console.log("\u26A0\uFE0F Continuing without email notification due to error");
      }
      res.json(invitation);
    } catch (error) {
      console.error("Error sending team invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });
  app2.delete("/api/team/invitations/:invitationId", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const invitationId = parseInt(req.params.invitationId);
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }
      const currentUserMember = await storage.getTeamMemberByUserAndTeam(userId, team.id);
      if (!currentUserMember || !["owner", "admin"].includes(currentUserMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions to delete invitations" });
      }
      const invitation = await storage.getTeamInvitationById(invitationId);
      if (!invitation || invitation.teamId !== team.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      await storage.deleteTeamInvitation(invitationId);
      try {
        const currentUser = await storage.getUserById(userId);
        await sendInvitationCancellationEmail(invitation.email, currentUser?.name || "Team Admin");
        console.log("\u2705 Invitation cancellation email sent to:", invitation.email);
      } catch (emailError) {
        console.error("\u274C Failed to send cancellation email:", emailError);
        console.log("\u26A0\uFE0F Continuing without email notification due to error");
      }
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting team invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });
  app2.put("/api/team/members/:memberId/role", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const memberId = parseInt(req.params.memberId);
      const { role } = req.body;
      if (!role || !["viewer", "member", "admin"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }
      const currentUserMember = await storage.getTeamMemberByUserAndTeam(userId, team.id);
      if (!currentUserMember || !["owner", "admin"].includes(currentUserMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions to modify roles" });
      }
      const targetMember = await storage.getTeamMemberById(memberId);
      if (!targetMember || targetMember.role === "owner") {
        return res.status(403).json({ message: "Cannot modify owner role" });
      }
      const updatedMember = await storage.updateTeamMemberRole(memberId, role);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });
  app2.delete("/api/user/reset-data", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const success = await storage.resetAllUserData(userId);
      if (success) {
        res.json({ message: "All data has been reset successfully" });
      } else {
        res.status(500).json({ message: "Failed to reset data" });
      }
    } catch (error) {
      console.error("Error resetting user data:", error);
      res.status(500).json({ message: "Failed to reset data" });
    }
  });
  app2.post("/api/profile/photo/upload-url", authenticateToken, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting photo upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.put("/api/profile/photo", authenticateToken, async (req, res) => {
    const { photoURL } = req.body;
    if (!photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        photoURL,
        {
          owner: String(userId),
          visibility: "public"
        }
      );
      res.status(200).json({
        objectPath,
        message: "Profile photo updated successfully"
      });
    } catch (error) {
      console.error("Error updating profile photo:", error);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  });
  app2.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/demo/upload", authenticateToken, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.put("/api/demo/video", authenticateToken, async (req, res) => {
    if (!req.body.videoURL) {
      return res.status(400).json({ error: "videoURL is required" });
    }
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.videoURL,
        {
          owner: "system",
          visibility: "public"
          // Demo videos should be publicly accessible
        }
      );
      res.status(200).json({
        objectPath,
        message: "Demo video uploaded successfully"
      });
    } catch (error) {
      console.error("Error setting demo video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
