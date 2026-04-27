import { 
  tasks, habits, habitEntries, pomodoroSessions, users, teams, teamMembers, teamInvitations,
  goals, focusBlocks, focusInterruptions,
  type Task, type InsertTask,
  type Habit, type InsertHabit,
  type HabitEntry, type InsertHabitEntry,
  type PomodoroSession, type InsertPomodoroSession,
  type FocusBlock, type InsertFocusBlock,
  type FocusInterruption, type InsertFocusInterruption,
  type User, type InsertUser,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type TeamInvitation, type InsertTeamInvitation,
  type Goal, type InsertGoal
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, lt, gte, lte, or, desc } from "drizzle-orm";

export type FocusBlockWithInterruptions = FocusBlock & {
  interruptions: FocusInterruption[];
};

export interface IStorage {
  // Tasks - User-specific
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number, userId: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number, userId: number): Promise<boolean>;
  getTasksByWeek(userId: number, weekKey: string): Promise<Task[]>;
  getIncompleteTasksForCarryForward(userId: number, currentWeekKey: string): Promise<Task[]>;
  carryForwardTasks(userId: number, fromWeekKey: string, toWeekKey: string): Promise<Task[]>;

  // Habits - User-specific
  getHabits(userId: number): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, userId: number, updates: Partial<InsertHabit>): Promise<Habit>;
  deleteHabit(id: number, userId: number): Promise<boolean>;

  // Habit Entries - User-specific
  getHabitEntries(userId: number, habitId?: number, date?: string): Promise<HabitEntry[]>;
  createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry>;
  updateHabitEntry(id: number, userId: number, updates: Partial<InsertHabitEntry>): Promise<HabitEntry>;
  toggleHabitEntry(habitId: number, date: string, userId: number): Promise<HabitEntry>;

  // Pomodoro Sessions - User-specific
  getPomodoroSessions(userId: number): Promise<PomodoroSession[]>;
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;

  // Focus Blocks - User-specific
  getActiveFocusBlock(userId: number): Promise<FocusBlockWithInterruptions | undefined>;
  startFocusBlock(userId: number, plannedDurationMin: number): Promise<FocusBlockWithInterruptions>;
  pauseFocusBlock(userId: number, blockId: number): Promise<FocusBlockWithInterruptions>;
  resumeFocusBlock(userId: number, blockId: number): Promise<FocusBlockWithInterruptions>;
  addFocusInterruption(userId: number, blockId: number, interruptionType: string, note?: string): Promise<FocusInterruption>;
  completeFocusBlock(userId: number, blockId: number, qualityRating?: number): Promise<FocusBlockWithInterruptions>;
  getFocusBlocks(userId: number, from?: Date, to?: Date): Promise<FocusBlock[]>;

  // Reset all user data
  resetAllUserData(userId: number): Promise<boolean>;

  // Goals - User-specific
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number, userId: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, userId: number, updates: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: number, userId: number): Promise<boolean>;

  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  verifyUser(email: string): Promise<User>;

  // Team Collaboration
  getTeamById(id: number): Promise<Team | undefined>;
  getTeamByUserId(userId: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMembersByUserId(userId: number): Promise<TeamMember[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  getTeamInvitations(teamId: number): Promise<TeamInvitation[]>;
  getTeamInvitationsByUserId(userId: number): Promise<TeamInvitation[]>;
  createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation>;
  updateTeamInvitationStatus(id: number, status: string): Promise<TeamInvitation>;
  getTeamInvitationById(id: number): Promise<TeamInvitation | undefined>;
  deleteTeamInvitation(id: number): Promise<boolean>;
  getInvitationsByEmail(email: string): Promise<TeamInvitation[]>;
  getTeamMemberById(id: number): Promise<TeamMember | undefined>;
  updateTeamMemberRole(memberId: number, role: string): Promise<TeamMember>;
  getTeamMemberByUserAndTeam(userId: number, teamId: number): Promise<TeamMember | undefined>;
}

export class DatabaseStorage implements IStorage {
  private focusFallbackBlocks = new Map<number, FocusBlock[]>();
  private focusFallbackInterruptions = new Map<number, FocusInterruption[]>();
  private focusFallbackNextBlockId = 1;
  private focusFallbackNextInterruptionId = 1;

  constructor() {
    // Initialize with default habits when database is empty
    this.initializeDefaultData();
  }

  private isMissingFocusTableError(error: unknown): boolean {
    const message = String((error as any)?.message || "").toLowerCase();
    return message.includes("focus_blocks") || message.includes("focus_interruptions");
  }

  private getFallbackUserBlocks(userId: number): FocusBlock[] {
    return this.focusFallbackBlocks.get(userId) || [];
  }

  private setFallbackUserBlocks(userId: number, blocks: FocusBlock[]): void {
    this.focusFallbackBlocks.set(userId, blocks);
  }

  private getFallbackInterruptions(blockId: number): FocusInterruption[] {
    return this.focusFallbackInterruptions.get(blockId) || [];
  }

  private setFallbackInterruptions(blockId: number, interruptions: FocusInterruption[]): void {
    this.focusFallbackInterruptions.set(blockId, interruptions);
  }

  private toFocusBlockWithInterruptions(block: FocusBlock, interruptions: FocusInterruption[]): FocusBlockWithInterruptions {
    return {
      ...block,
      interruptions,
    };
  }

  private async initializeDefaultData() {
    try {
      // Check if habits already exist
      const existingHabits = await this.getHabits(1);
      if (existingHabits.length === 0) {
        // Create default habits
        const defaultHabits = [
          { name: "Drink Water", icon: "fas fa-tint", color: "blue-500" },
          { name: "Workout", icon: "fas fa-dumbbell", color: "green-500" },
          { name: "Read", icon: "fas fa-book", color: "purple-500" },
          { name: "Meditate", icon: "fas fa-leaf", color: "green-600" },
        ];

        for (const habit of defaultHabits) {
          await this.createHabit({ ...habit, userId: 1 });
        }
      }
    } catch (error) {
      console.log('Database tables not yet created, will initialize on first push');
    }
  }

  // Tasks - User-specific
  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: number, userId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    console.log('Creating task in storage:', insertTask);
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    console.log('Task created in database:', task);
    return task;
  }

  async updateTask(id: number, userId: number, updates: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    return task;
  }

  async deleteTask(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getTasksByWeek(userId: number, weekKey: string): Promise<Task[]> {
    return await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.weekKey, weekKey)));
  }

  async getIncompleteTasksForCarryForward(userId: number, currentWeekKey: string): Promise<Task[]> {
    // Get ALL incomplete tasks from ALL weeks BEFORE the target week
    // This includes 'proposed', 'in_task', and 'hurdles' statuses, but excludes 'completed'
    return await db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        lt(tasks.weekKey, currentWeekKey), // Get tasks from weeks BEFORE the target week
        ne(tasks.status, 'completed')
      )
    );
  }

  async carryForwardTasks(userId: number, fromWeekKey: string, toWeekKey: string): Promise<Task[]> {
    // Get ALL incomplete tasks from weeks BEFORE the target week (toWeekKey)
    const incompleteTasks = await this.getIncompleteTasksForCarryForward(userId, toWeekKey);
    
    const carriedTasks = [];
    for (const task of incompleteTasks) {
      // UPDATE the existing task's weekKey to move it to the new week (no duplication)
      // Preserve the original status (in_task, hurdles, proposed) - don't reset to proposed
      const updatedTask = await this.updateTask(task.id, userId, {
        weekKey: toWeekKey,
        originalWeek: task.originalWeek || task.weekKey, // Track original week
      });
      carriedTasks.push(updatedTask);
    }
    
    return carriedTasks;
  }

  // Habits - User-specific
  async getHabits(userId: number): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }

  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const [habit] = await db
      .insert(habits)
      .values(insertHabit)
      .returning();
    return habit;
  }

  async updateHabit(id: number, userId: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const [habit] = await db
      .update(habits)
      .set(updates)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();
    if (!habit) {
      throw new Error(`Habit with id ${id} not found`);
    }
    return habit;
  }

  async deleteHabit(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Habit Entries - User-specific
  async getHabitEntries(userId: number, habitId?: number, date?: string): Promise<HabitEntry[]> {
    let conditions = [eq(habitEntries.userId, userId)];
    
    if (habitId) {
      conditions.push(eq(habitEntries.habitId, habitId));
    }
    if (date) {
      conditions.push(eq(habitEntries.date, date));
    }
    
    return await db.select().from(habitEntries).where(and(...conditions));
  }

  async createHabitEntry(insertEntry: InsertHabitEntry): Promise<HabitEntry> {
    const [entry] = await db
      .insert(habitEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateHabitEntry(id: number, userId: number, updates: Partial<InsertHabitEntry>): Promise<HabitEntry> {
    const [entry] = await db
      .update(habitEntries)
      .set(updates)
      .where(and(eq(habitEntries.id, id), eq(habitEntries.userId, userId)))
      .returning();
    if (!entry) {
      throw new Error(`Habit entry with id ${id} not found`);
    }
    return entry;
  }

  async toggleHabitEntry(habitId: number, date: string, userId: number): Promise<HabitEntry> {
    // Find existing entry
    const existingEntries = await this.getHabitEntries(userId, habitId, date);
    const existingEntry = existingEntries[0];

    if (existingEntry) {
      // Toggle existing entry
      return this.updateHabitEntry(existingEntry.id, userId, { completed: !existingEntry.completed });
    } else {
      // Create new completed entry
      return this.createHabitEntry({ habitId, date, completed: true, userId });
    }
  }

  // Pomodoro Sessions - User-specific
  async getPomodoroSessions(userId: number): Promise<PomodoroSession[]> {
    return await db.select().from(pomodoroSessions).where(eq(pomodoroSessions.userId, userId));
  }

  async createPomodoroSession(insertSession: InsertPomodoroSession): Promise<PomodoroSession> {
    const [session] = await db
      .insert(pomodoroSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getActiveFocusBlock(userId: number): Promise<FocusBlockWithInterruptions | undefined> {
    try {
      const [block] = await db.select().from(focusBlocks)
        .where(
          and(
            eq(focusBlocks.userId, userId),
            or(eq(focusBlocks.status, "active"), eq(focusBlocks.status, "paused")),
          ),
        )
        .orderBy(desc(focusBlocks.startedAt))
        .limit(1);

      if (!block) return undefined;

      const interruptions = await db.select().from(focusInterruptions)
        .where(eq(focusInterruptions.focusBlockId, block.id))
        .orderBy(desc(focusInterruptions.occurredAt));

      return this.toFocusBlockWithInterruptions(block, interruptions.reverse());
    } catch (error) {
      if (!this.isMissingFocusTableError(error)) throw error;

      const blocks = this.getFallbackUserBlocks(userId)
        .filter((block) => block.status === "active" || block.status === "paused")
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      const block = blocks[0];
      if (!block) return undefined;
      return this.toFocusBlockWithInterruptions(block, this.getFallbackInterruptions(block.id));
    }
  }

  async startFocusBlock(userId: number, plannedDurationMin: number): Promise<FocusBlockWithInterruptions> {
    try {
      // Attempt to create focus block - will fail with unique constraint if one already exists
      const [block] = await db.insert(focusBlocks).values({
        userId,
        plannedDurationMin,
        status: "active",
      }).returning();

      return this.toFocusBlockWithInterruptions(block, []);
    } catch (error: any) {
      // Handle unique constraint violation (already have active focus block)
      if (error.code === '23505' || error.message?.includes('unique')) {
        throw new Error("A focus block is already active for this user");
      }

      if (!this.isMissingFocusTableError(error)) throw error;

      // Fallback for in-memory storage
      const activeBlock = this.getFallbackUserBlocks(userId).find(b => b.status === 'active');
      if (activeBlock) {
        throw new Error("A focus block is already active");
      }

      const now = new Date();
      const fallbackBlock: FocusBlock = {
        id: this.focusFallbackNextBlockId++,
        userId,
        plannedDurationMin,
        status: "active",
        startedAt: now,
        pausedAt: null,
        totalPausedMs: 0,
        completedAt: null,
        actualDurationSec: null,
        qualityRating: null,
        createdAt: now,
      };
      const existing = this.getFallbackUserBlocks(userId);
      this.setFallbackUserBlocks(userId, [...existing, fallbackBlock]);
      return this.toFocusBlockWithInterruptions(fallbackBlock, []);
    }
  }

  async pauseFocusBlock(userId: number, blockId: number): Promise<FocusBlockWithInterruptions> {
    try {
      const [updated] = await db.update(focusBlocks)
        .set({ status: "paused", pausedAt: new Date() })
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId), eq(focusBlocks.status, "active")))
        .returning();

      const block = updated || (await db.select().from(focusBlocks)
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId)))
        .limit(1))[0];

      if (!block) throw new Error("Focus block not found");

      const interruptions = await db.select().from(focusInterruptions)
        .where(eq(focusInterruptions.focusBlockId, block.id))
        .orderBy(desc(focusInterruptions.occurredAt));

      return this.toFocusBlockWithInterruptions(block, interruptions.reverse());
    } catch (error) {
      if (!this.isMissingFocusTableError(error)) throw error;

      const blocks = this.getFallbackUserBlocks(userId);
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index === -1) throw new Error("Focus block not found");

      const block = blocks[index];
      if (block.status === "active") {
        blocks[index] = { ...block, status: "paused", pausedAt: new Date() };
        this.setFallbackUserBlocks(userId, blocks);
      }
      return this.toFocusBlockWithInterruptions(blocks[index], this.getFallbackInterruptions(blockId));
    }
  }

  async resumeFocusBlock(userId: number, blockId: number): Promise<FocusBlockWithInterruptions> {
    try {
      const [block] = await db.select().from(focusBlocks)
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId)))
        .limit(1);

      if (!block) throw new Error("Focus block not found");

      let totalPausedMs = block.totalPausedMs || 0;
      if (block.status === "paused" && block.pausedAt) {
        totalPausedMs += Math.max(0, Date.now() - new Date(block.pausedAt).getTime());
      }

      const [updated] = await db.update(focusBlocks)
        .set({ status: "active", pausedAt: null, totalPausedMs })
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId)))
        .returning();

      const interruptions = await db.select().from(focusInterruptions)
        .where(eq(focusInterruptions.focusBlockId, updated.id))
        .orderBy(desc(focusInterruptions.occurredAt));

      return this.toFocusBlockWithInterruptions(updated, interruptions.reverse());
    } catch (error) {
      if (!this.isMissingFocusTableError(error)) throw error;

      const blocks = this.getFallbackUserBlocks(userId);
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index === -1) throw new Error("Focus block not found");

      const block = blocks[index];
      let totalPausedMs = block.totalPausedMs || 0;
      if (block.status === "paused" && block.pausedAt) {
        totalPausedMs += Math.max(0, Date.now() - new Date(block.pausedAt).getTime());
      }

      const updated = { ...block, status: "active", pausedAt: null, totalPausedMs } as FocusBlock;
      blocks[index] = updated;
      this.setFallbackUserBlocks(userId, blocks);
      return this.toFocusBlockWithInterruptions(updated, this.getFallbackInterruptions(blockId));
    }
  }

  async addFocusInterruption(userId: number, blockId: number, interruptionType: string, note?: string): Promise<FocusInterruption> {
    try {
      const [block] = await db.select().from(focusBlocks)
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId)))
        .limit(1);

      if (!block) throw new Error("Focus block not found");

      const [interruption] = await db.insert(focusInterruptions).values({
        focusBlockId: blockId,
        userId,
        interruptionType,
        note,
      }).returning();

      return interruption;
    } catch (error) {
      if (!this.isMissingFocusTableError(error)) throw error;

      const blocks = this.getFallbackUserBlocks(userId);
      const blockExists = blocks.some((block) => block.id === blockId);
      if (!blockExists) throw new Error("Focus block not found");

      const interruption: FocusInterruption = {
        id: this.focusFallbackNextInterruptionId++,
        focusBlockId: blockId,
        userId,
        interruptionType,
        note: note || null,
        occurredAt: new Date(),
      };
      const existing = this.getFallbackInterruptions(blockId);
      this.setFallbackInterruptions(blockId, [...existing, interruption]);
      return interruption;
    }
  }

  async completeFocusBlock(userId: number, blockId: number, qualityRating?: number): Promise<FocusBlockWithInterruptions> {
    const now = new Date();

    try {
      const [block] = await db.select().from(focusBlocks)
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId)))
        .limit(1);

      if (!block) throw new Error("Focus block not found");

      let totalPausedMs = block.totalPausedMs || 0;
      if (block.status === "paused" && block.pausedAt) {
        totalPausedMs += Math.max(0, now.getTime() - new Date(block.pausedAt).getTime());
      }

      const elapsedMs = Math.max(0, now.getTime() - new Date(block.startedAt).getTime() - totalPausedMs);
      const actualDurationSec = Math.max(60, Math.round(elapsedMs / 1000));

      const [updated] = await db.update(focusBlocks)
        .set({
          status: "completed",
          pausedAt: null,
          totalPausedMs,
          completedAt: now,
          actualDurationSec,
          qualityRating: qualityRating ?? block.qualityRating,
        })
        .where(and(eq(focusBlocks.id, blockId), eq(focusBlocks.userId, userId)))
        .returning();

      await this.createPomodoroSession({
        userId,
        duration: actualDurationSec,
        type: "focus_block",
      });

      const interruptions = await db.select().from(focusInterruptions)
        .where(eq(focusInterruptions.focusBlockId, updated.id))
        .orderBy(desc(focusInterruptions.occurredAt));

      return this.toFocusBlockWithInterruptions(updated, interruptions.reverse());
    } catch (error) {
      if (!this.isMissingFocusTableError(error)) throw error;

      const blocks = this.getFallbackUserBlocks(userId);
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index === -1) throw new Error("Focus block not found");

      const block = blocks[index];
      let totalPausedMs = block.totalPausedMs || 0;
      if (block.status === "paused" && block.pausedAt) {
        totalPausedMs += Math.max(0, now.getTime() - new Date(block.pausedAt).getTime());
      }

      const elapsedMs = Math.max(0, now.getTime() - new Date(block.startedAt).getTime() - totalPausedMs);
      const actualDurationSec = Math.max(60, Math.round(elapsedMs / 1000));

      const updated = {
        ...block,
        status: "completed",
        pausedAt: null,
        totalPausedMs,
        completedAt: now,
        actualDurationSec,
        qualityRating: qualityRating ?? block.qualityRating,
      } as FocusBlock;

      blocks[index] = updated;
      this.setFallbackUserBlocks(userId, blocks);

      await this.createPomodoroSession({
        userId,
        duration: actualDurationSec,
        type: "focus_block",
      });

      return this.toFocusBlockWithInterruptions(updated, this.getFallbackInterruptions(blockId));
    }
  }

  async getFocusBlocks(userId: number, from?: Date, to?: Date): Promise<FocusBlock[]> {
    try {
      const baseConditions = [eq(focusBlocks.userId, userId), eq(focusBlocks.status, "completed")];

      if (from) {
        baseConditions.push(gte(focusBlocks.completedAt, from));
      }
      if (to) {
        baseConditions.push(lte(focusBlocks.completedAt, to));
      }

      return await db.select().from(focusBlocks)
        .where(and(...baseConditions))
        .orderBy(desc(focusBlocks.completedAt));
    } catch (error) {
      if (!this.isMissingFocusTableError(error)) throw error;

      return this.getFallbackUserBlocks(userId)
        .filter((block) => block.status === "completed")
        .filter((block) => {
          if (!block.completedAt) return false;
          if (from && new Date(block.completedAt) < from) return false;
          if (to && new Date(block.completedAt) > to) return false;
          return true;
        })
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime;
        });
    }
  }

  async resetAllUserData(userId: number): Promise<boolean> {
    try {
      try {
        // Delete all user's focus interruptions first
        await db.delete(focusInterruptions).where(eq(focusInterruptions.userId, userId));

        // Delete all user's focus blocks
        await db.delete(focusBlocks).where(eq(focusBlocks.userId, userId));
      } catch (error) {
        if (!this.isMissingFocusTableError(error)) {
          throw error;
        }
      }

      // Delete all user's pomodoro sessions
      await db.delete(pomodoroSessions).where(eq(pomodoroSessions.userId, userId));
      
      // Delete all user's habit entries
      await db.delete(habitEntries).where(eq(habitEntries.userId, userId));
      
      // Delete all user's habits
      await db.delete(habits).where(eq(habits.userId, userId));
      
      // Delete all user's tasks
      await db.delete(tasks).where(eq(tasks.userId, userId));

      // Clear fallback focus state for this user
      this.focusFallbackBlocks.delete(userId);
      for (const [blockId, interruptions] of this.focusFallbackInterruptions.entries()) {
        if (interruptions.some((item) => item.userId === userId)) {
          this.focusFallbackInterruptions.delete(blockId);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error resetting user data:", error);
      return false;
    }
  }

  // Goals - User-specific
  async getGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number, userId: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values(goal).returning();
    return created;
  }

  async updateGoal(id: number, userId: number, updates: Partial<InsertGoal>): Promise<Goal> {
    const [updated] = await db.update(goals).set(updates).where(and(eq(goals.id, id), eq(goals.userId, userId))).returning();
    if (!updated) throw new Error(`Goal with id ${id} not found`);
    return updated;
  }

  async deleteGoal(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Users
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyUser(email: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    return user;
  }

  // Team Collaboration Methods
  async getTeamById(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }

  async getTeamByUserId(userId: number): Promise<Team | undefined> {
    const membershipResult = await db.select()
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId))
      .limit(1);
    
    return membershipResult[0]?.teams;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    
    // Automatically add the owner as a team member
    await this.addTeamMember({
      teamId: result[0].id,
      userId: team.ownerId,
      role: 'owner'
    });
    
    return result[0];
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const result = await db.select({
      id: teamMembers.id,
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      lastActive: teamMembers.lastActive,
      name: users.name,
      email: users.email
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
    
    return result;
  }

  async getTeamMembersByUserId(userId: number): Promise<TeamMember[]> {
    const result = await db.select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    return result;
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }


  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getTeamInvitations(teamId: number): Promise<TeamInvitation[]> {
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
    })
    .from(teamInvitations)
    .innerJoin(users, eq(teamInvitations.invitedBy, users.id))
    .where(eq(teamInvitations.teamId, teamId));
    
    return result;
  }

  async getTeamInvitationsByUserId(userId: number): Promise<TeamInvitation[]> {
    const result = await db.select()
      .from(teamInvitations)
      .where(eq(teamInvitations.invitedBy, userId));
    
    return result;
  }

  async createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation> {
    const result = await db.insert(teamInvitations).values(invitation).returning();
    return result[0];
  }

  async updateTeamInvitationStatus(id: number, status: string): Promise<TeamInvitation> {
    const result = await db.update(teamInvitations)
      .set({ status })
      .where(eq(teamInvitations.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Team invitation not found");
    }
    
    return result[0];
  }

  async getTeamInvitationById(id: number): Promise<TeamInvitation | undefined> {
    const result = await db.select()
      .from(teamInvitations)
      .where(eq(teamInvitations.id, id));
    
    return result[0];
  }

  async deleteTeamInvitation(id: number): Promise<boolean> {
    const result = await db.delete(teamInvitations)
      .where(eq(teamInvitations.id, id))
      .returning();

    return result.length > 0;
  }

  async getInvitationsByEmail(email: string): Promise<TeamInvitation[]> {
    return await db.select()
      .from(teamInvitations)
      .where(and(eq(teamInvitations.email, email), eq(teamInvitations.status, 'pending')));
  }

  async getTeamMemberById(id: number): Promise<TeamMember | undefined> {
    const result = await db.select()
      .from(teamMembers)
      .where(eq(teamMembers.id, id));
    
    return result[0];
  }

  async updateTeamMemberRole(memberId: number, role: string): Promise<TeamMember> {
    const result = await db.update(teamMembers)
      .set({ role })
      .where(eq(teamMembers.id, memberId))
      .returning();
    
    if (!result[0]) {
      throw new Error("Team member not found");
    }
    
    return result[0];
  }

  async getTeamMemberByUserAndTeam(userId: number, teamId: number): Promise<TeamMember | undefined> {
    const result = await db.select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
    
    return result[0];
  }
}

export const storage = new DatabaseStorage();
