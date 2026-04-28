import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./authRoutes";
import { authenticateToken, type AuthenticatedRequest } from "./middleware";
import { insertTaskSchema, insertHabitSchema, insertHabitEntrySchema, insertPomodoroSessionSchema, workspaceInviteLinks } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { createDataBackup, exportUserData } from "./backup";
import { getPaginationParams, createPaginatedResponse } from "./pagination";
import archiver from "archiver";
import { sendEmail, getDisplayFromAddress } from "./email";
import * as XLSX from 'xlsx';

function toMs(value: Date | string | null): number | null {
  if (!value) return null;
  return new Date(value).getTime();
}

function serializeActiveFocusBlock(block: {
  id: number;
  userId: number;
  plannedDurationMin: number;
  startedAt: Date | string;
  status: string;
  pausedAt: Date | string | null;
  totalPausedMs: number;
  interruptions: Array<{ id: number; interruptionType: string; note: string | null; occurredAt: Date | string }>;
}) {
  const nowMs = Date.now();
  const startedAtMs = toMs(block.startedAt) || nowMs;
  const pausedAtMs = toMs(block.pausedAt);
  const currentPausedMs = block.status === "paused" && pausedAtMs ? Math.max(0, nowMs - pausedAtMs) : 0;
  const elapsedMs = Math.max(0, nowMs - startedAtMs - (block.totalPausedMs || 0) - currentPausedMs);
  const plannedSeconds = block.plannedDurationMin * 60;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return {
    ...block,
    startedAt: new Date(block.startedAt).toISOString(),
    pausedAt: block.pausedAt ? new Date(block.pausedAt).toISOString() : null,
    interruptions: block.interruptions.map((item) => ({
      ...item,
      occurredAt: new Date(item.occurredAt).toISOString(),
    })),
    elapsedSeconds,
    remainingSeconds: Math.max(0, plannedSeconds - elapsedSeconds),
  };
}

// Helper function to convert JSON data to CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Excel export functionality with professional formatting
function createExcelWorkbook(data: any, userId: number): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Create summary sheet
  const summaryData = [
    ['Flowsstate Data Export'],
    [''],
    ['Export Date:', new Date().toISOString().split('T')[0]],
    ['User ID:', userId],
    [''],
    ['Data Summary:'],
    ['Tasks:', data.tasks?.length || 0],
    ['Habits:', data.habits?.length || 0],
    ['Habit Entries:', data.habitEntries?.length || 0],
    ['Pomodoro Sessions:', data.pomodoroSessions?.length || 0],
    [''],
    ['Sheet Overview:'],
    ['• Tasks - All your tasks and their details'],
    ['• Habits - Your habit definitions and settings'],
    ['• Habit Entries - Daily habit completion records'],
    ['• Pomodoro Sessions - Focus session history'],
    ['• Statistics - Data analysis and insights']
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Style the summary sheet
  summarySheet['!cols'] = [{ width: 25 }, { width: 30 }];
  summarySheet['A1'] = { v: 'Flowsstate Data Export', t: 's', s: { font: { bold: true, sz: 16 } } };
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Tasks sheet with formatted data
  if (data.tasks && data.tasks.length > 0) {
    const taskHeaders = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Day of Week', 'Week', 'Notes', 'Created Date'];
    const taskData = data.tasks.map((task: any) => [
      task.id,
      task.title,
      task.category,
      task.priority,
      task.status,
      task.dayOfWeek,
      task.weekKey,
      task.notes || '',
      new Date(task.createdAt).toLocaleDateString()
    ]);
    
    const tasksSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskData]);
    tasksSheet['!cols'] = [
      { width: 8 }, { width: 25 }, { width: 15 }, { width: 12 }, 
      { width: 12 }, { width: 15 }, { width: 12 }, { width: 30 }, { width: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');
  }
  
  // Habits sheet
  if (data.habits && data.habits.length > 0) {
    const habitHeaders = ['ID', 'Name', 'Icon', 'Color', 'Category', 'Schedule', 'Created Date'];
    const habitData = data.habits.map((habit: any) => [
      habit.id,
      habit.name,
      habit.icon || '',
      habit.color || '',
      habit.category || '',
      habit.schedule || 'daily',
      new Date(habit.createdAt).toLocaleDateString()
    ]);
    
    const habitsSheet = XLSX.utils.aoa_to_sheet([habitHeaders, ...habitData]);
    habitsSheet['!cols'] = [
      { width: 8 }, { width: 20 }, { width: 8 }, { width: 12 }, 
      { width: 15 }, { width: 12 }, { width: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, habitsSheet, 'Habits');
  }
  
  // Habit Entries sheet
  if (data.habitEntries && data.habitEntries.length > 0) {
    const entryHeaders = ['ID', 'Habit ID', 'Date', 'Completed', 'Notes'];
    const entryData = data.habitEntries.map((entry: any) => [
      entry.id,
      entry.habitId,
      entry.date,
      entry.completed ? 'Yes' : 'No',
      entry.notes || ''
    ]);
    
    const entriesSheet = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryData]);
    entriesSheet['!cols'] = [
      { width: 8 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 30 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Habit Entries');
  }
  
  // Pomodoro Sessions sheet
  if (data.pomodoroSessions && data.pomodoroSessions.length > 0) {
    const sessionHeaders = ['ID', 'Type', 'Duration (min)', 'Started At', 'Completed At', 'Task', 'Notes'];
    const sessionData = data.pomodoroSessions.map((session: any) => [
      session.id,
      session.type,
      session.duration,
      new Date(session.startedAt).toLocaleString(),
      session.completedAt ? new Date(session.completedAt).toLocaleString() : 'Not completed',
      session.taskTitle || '',
      session.notes || ''
    ]);
    
    const sessionsSheet = XLSX.utils.aoa_to_sheet([sessionHeaders, ...sessionData]);
    sessionsSheet['!cols'] = [
      { width: 8 }, { width: 12 }, { width: 15 }, { width: 20 }, 
      { width: 20 }, { width: 25 }, { width: 30 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, sessionsSheet, 'Pomodoro Sessions');
  }
  
  // Statistics sheet
  const statsData = [
    ['Productivity Statistics'],
    [''],
    ['Task Statistics:'],
    ['Total Tasks:', data.tasks?.length || 0],
    ['Completed Tasks:', data.tasks?.filter((t: any) => t.status === 'completed').length || 0],
    ['In Progress Tasks:', data.tasks?.filter((t: any) => t.status === 'in-progress').length || 0],
    [''],
    ['Habit Statistics:'],
    ['Total Habits:', data.habits?.length || 0],
    ['Total Habit Entries:', data.habitEntries?.length || 0],
    ['Completed Entries:', data.habitEntries?.filter((e: any) => e.completed).length || 0],
    ['Completion Rate:', data.habitEntries?.length ? 
      `${Math.round((data.habitEntries.filter((e: any) => e.completed).length / data.habitEntries.length) * 100)}%` : '0%'],
    [''],
    ['Focus Statistics:'],
    ['Total Pomodoro Sessions:', data.pomodoroSessions?.length || 0],
    ['Completed Sessions:', data.pomodoroSessions?.filter((s: any) => s.completedAt).length || 0],
    ['Total Focus Time (min):', data.pomodoroSessions?.reduce((sum: number, s: any) => 
      s.completedAt ? sum + s.duration : sum, 0) || 0]
  ];
  
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [{ width: 25 }, { width: 20 }];
  
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Team invitation email sending function
async function sendTeamInvitationEmail(email: string, inviterName: string, role: string, invitationId: number): Promise<boolean> {
  const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000');
    
  const emailContent = {
    to: email,
    from: getDisplayFromAddress('team'),
    subject: `${inviterName} invited you to join their Flowsstate team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Flowsstate</h1>
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
            <a href="${FRONTEND_URL}/accept-invite?inviteId=${invitationId}&email=${encodeURIComponent(email)}"
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 12px;">
            Or copy this link: ${FRONTEND_URL}/accept-invite?inviteId=${invitationId}&email=${encodeURIComponent(email)}
          </p>
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
          <p>© 2025 Flowsstate. Built for modern teams.</p>
        </div>
      </div>
    `
  };
  
  return await sendEmail(emailContent);
}

// Invitation cancellation email sending function
async function sendInvitationCancellationEmail(email: string, cancelledBy: string): Promise<boolean> {
  const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000');
    
  const emailContent = {
    to: email,
    from: getDisplayFromAddress('noreply'),
    subject: `Team invitation cancelled - Flowsstate`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Flowsstate</h1>
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
            <a href="${FRONTEND_URL}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
              Visit Flowsstate
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p>If you have any questions, please contact the team administrator.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>© 2025 Flowsstate. Built for modern teams.</p>
        </div>
      </div>
    `
  };
  
  return await sendEmail(emailContent);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use('/api/auth', authRoutes);

  // CRITICAL: Data backup and export endpoints
  
  // Excel export endpoint
  app.get("/api/export/excel", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const backupData = await exportUserData(userId);
      const parsedData = JSON.parse(backupData);
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Generate Excel file
      const excelBuffer = createExcelWorkbook(parsedData, userId);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="productivity_export_${userId}_${timestamp}.xlsx"`);
      res.setHeader('Content-Length', excelBuffer.length.toString());
      
      res.send(excelBuffer);
    } catch (error) {
      console.error('Excel export failed:', error);
      res.status(500).json({ message: "Failed to create Excel export" });
    }
  });

  app.get("/api/export/data", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const backupData = await exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="productivity_backup_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
      res.send(backupData);
    } catch (error) {
      console.error('Export failed:', error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.get("/api/backup/create", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const backup = await createDataBackup(userId);
      
      res.json({
        message: "Backup created successfully",
        backup,
        timestamp: backup.timestamp,
        totalRecords: backup.metadata.totalRecords
      });
    } catch (error) {
      console.error('Backup creation failed:', error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Download data as ZIP file
  app.get("/api/export/zip", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const backupData = await exportUserData(userId);
      const timestamp = new Date().toISOString().split('T')[0];
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="productivity_backup_${userId}_${timestamp}.zip"`);
      
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      archive.pipe(res);
      
      // Add the JSON backup file
      archive.append(JSON.stringify(backupData, null, 2), { 
        name: `productivity_backup_${timestamp}.json` 
      });
      
      // Add individual CSV files for each data type
      const backup = JSON.parse(backupData);
      
      if (backup.tasks && backup.tasks.length > 0) {
        const tasksCsv = convertToCSV(backup.tasks);
        archive.append(tasksCsv, { name: 'tasks.csv' });
      }
      
      if (backup.habits && backup.habits.length > 0) {
        const habitsCsv = convertToCSV(backup.habits);
        archive.append(habitsCsv, { name: 'habits.csv' });
      }
      
      if (backup.habitEntries && backup.habitEntries.length > 0) {
        const habitEntriesCsv = convertToCSV(backup.habitEntries);
        archive.append(habitEntriesCsv, { name: 'habit_entries.csv' });
      }
      
      if (backup.pomodoroSessions && backup.pomodoroSessions.length > 0) {
        const pomodoroSessionsCsv = convertToCSV(backup.pomodoroSessions);
        archive.append(pomodoroSessionsCsv, { name: 'pomodoro_sessions.csv' });
      }
      
      // Add a README file
      const readme = `Flowsstate Data Export
============================

Export Date: ${new Date().toISOString()}
User ID: ${userId}

Files Included:
- productivity_backup_${timestamp}.json: Complete data backup in JSON format
- tasks.csv: All your tasks and their details
- habits.csv: Your habit definitions and settings
- habit_entries.csv: Daily habit completion records
- pomodoro_sessions.csv: Focus session history

This export contains all your productivity data for backup and analysis purposes.
You can import this data back into Flowsstate or use it with other tools.

For support, contact: support@productivityhub.com
`;
      
      archive.append(readme, { name: 'README.txt' });
      
      await archive.finalize();
      
    } catch (error) {
      console.error('ZIP export failed:', error);
      res.status(500).json({ message: "Failed to create ZIP export" });
    }
  });
  // Enhanced task carry-forward endpoint
  app.post("/api/tasks/carry-forward", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
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
      console.error('Error carrying forward tasks:', error);
      res.status(500).json({ message: "Failed to carry forward tasks" });
    }
  });

  // Get tasks by week
  app.get("/api/tasks/week/:weekKey", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { weekKey } = req.params;
      const tasks = await storage.getTasksByWeek(userId, weekKey);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks by week:', error);
      res.status(500).json({ message: "Failed to fetch tasks for week" });
    }
  });

  // Tasks
  app.get("/api/tasks", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { limit, offset } = getPaginationParams(req.query);

      const allTasks = await storage.getTasks(userId);
      const total = allTasks.length;
      const paginatedTasks = allTasks.slice(offset, offset + limit);

      const response = createPaginatedResponse(paginatedTasks, limit, offset, total);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;

      // Ensure userId is properly included in the task data
      const taskData = {
        ...req.body,
        userId: userId
      };

      const task = insertTaskSchema.parse(taskData);

      const createdTask = await storage.createTask(task);
      res.json(createdTask);
    } catch (error: any) {
      console.error('Task creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task", error: error?.message || 'Unknown error' });
      }
    }
  });

  app.put("/api/tasks/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const updates = insertTaskSchema.partial().parse(req.body);
      
      // Check if task exists before updating to prevent duplicates
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

  app.delete("/api/tasks/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
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

  // Habits
  app.get("/api/habits", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { limit, offset } = getPaginationParams(req.query);

      const allHabits = await storage.getHabits(userId);
      const total = allHabits.length;
      const paginatedHabits = allHabits.slice(offset, offset + limit);

      const response = createPaginatedResponse(paginatedHabits, limit, offset, total);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const habit = insertHabitSchema.parse({...req.body, userId});
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

  app.put("/api/habits/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
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

  app.delete("/api/habits/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
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

  // Habit Entries
  app.get("/api/habit-entries", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const habitId = req.query.habitId ? parseInt(req.query.habitId as string) : undefined;
      const date = req.query.date as string;
      const entries = await storage.getHabitEntries(userId, habitId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit entries" });
    }
  });

  app.post("/api/habit-entries/toggle", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { habitId, date } = req.body;
      const entry = await storage.toggleHabitEntry(habitId, date, userId);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle habit entry" });
    }
  });

  // Pomodoro Sessions
  app.get("/api/pomodoro-sessions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const sessions = await storage.getPomodoroSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pomodoro sessions" });
    }
  });

  app.post("/api/pomodoro-sessions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const session = insertPomodoroSessionSchema.parse({...req.body, userId});
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

  // Enhanced API routes for comprehensive features
  
  // Goals API - fully authenticated, persisted to DB
  app.get("/api/goals", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { limit, offset } = getPaginationParams(req.query);

      const allGoals = await storage.getGoals(userId);
      const total = allGoals.length;
      const paginatedGoals = allGoals.slice(offset, offset + limit);

      const response = createPaginatedResponse(paginatedGoals, limit, offset, total);
      res.json(response);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { title, description, category, targetValue, currentValue, unit, deadline, priority, status } = req.body;
      if (!title || !targetValue || !unit || !deadline || !category) {
        return res.status(400).json({ message: "title, targetValue, unit, deadline, and category are required" });
      }
      const goal = await storage.createGoal({
        userId,
        title,
        description: description || null,
        category,
        targetValue: Number(targetValue),
        currentValue: Number(currentValue || 0),
        unit,
        deadline,
        priority: priority || "medium",
        status: status || "active",
      });
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      const updates = { ...req.body };
      if (updates.targetValue !== undefined) updates.targetValue = Number(updates.targetValue);
      if (updates.currentValue !== undefined) updates.currentValue = Number(updates.currentValue);
      const goal = await storage.updateGoal(id, userId, updates);
      res.json(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) return res.status(404).json({ message: "Goal not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Notifications API
  app.get("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const [tasks, habits, habitEntries] = await Promise.all([
        storage.getTasks(userId),
        storage.getHabits(userId),
        storage.getHabitEntries(userId),
      ]);

      const today = new Date();
      const todayDate = today.toISOString().split("T")[0];
      const todayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

      const todayTasks = tasks.filter((task) => task.dayOfWeek === todayName);
      const overdueHighPriority = todayTasks.filter(
        (task) => task.priority === "high" && task.status !== "completed",
      );

      const todayHabitEntries = habitEntries.filter((entry) => entry.date === todayDate);
      const completedHabitIds = new Set(
        todayHabitEntries.filter((entry) => entry.completed).map((entry) => entry.habitId),
      );
      const incompleteHabits = habits.filter((habit) => !completedHabitIds.has(habit.id));

      const notifications: any[] = [];

      if (overdueHighPriority.length > 0) {
        notifications.push({
          id: `high-priority-${todayDate}`,
          type: "deadline_alert",
          title: "High-priority tasks pending",
          message: `${overdueHighPriority.length} high-priority task(s) still open for today.`,
          priority: "high",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (incompleteHabits.length > 0) {
        notifications.push({
          id: `habits-${todayDate}`,
          type: "habit_reminder",
          title: "Habit check-in",
          message: `${incompleteHabits.length} habit(s) are still incomplete today.`,
          priority: "medium",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (todayTasks.length > 0 && todayTasks.every((task) => task.status === "completed")) {
        notifications.push({
          id: `tasks-done-${todayDate}`,
          type: "achievement",
          title: "Daily tasks complete",
          message: "Great work. You completed all tasks scheduled for today.",
          priority: "low",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Analytics API
  app.get("/api/analytics/productivity", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const [tasks, habits, habitEntries, pomodoroSessions] = await Promise.all([
        storage.getTasks(userId),
        storage.getHabits(userId),
        storage.getHabitEntries(userId),
        storage.getPomodoroSessions(userId),
      ]);

      const tasksCompleted = tasks.filter((task) => task.status === "completed").length;
      const completionRate = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;

      const highPriorityTasks = tasks.filter((task) => task.priority === "high");
      const highPriorityCompleted = highPriorityTasks.filter((task) => task.status === "completed").length;
      const highPriorityCompletionRate = highPriorityTasks.length > 0
        ? Math.round((highPriorityCompleted / highPriorityTasks.length) * 100)
        : 0;

      const habitsCompleted = habitEntries.filter((entry) => entry.completed).length;
      const habitCompletionRate = habitEntries.length > 0
        ? Math.round((habitsCompleted / habitEntries.length) * 100)
        : 0;

      const focusSessions = pomodoroSessions.filter(
        (session) => session.type === "focus" || session.type === "focus_block",
      );
      const focusMinutesTotal = Math.round(
        focusSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60,
      );

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const focusMinutesLast7Days = Math.round(
        focusSessions.reduce((sum, session) => {
          const completedAt = new Date(session.completedAt);
          if (completedAt >= sevenDaysAgo) {
            return sum + (session.duration || 0);
          }
          return sum;
        }, 0) / 60,
      );

      const todayName = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const todayTasks = tasks.filter((task) => task.dayOfWeek === todayName);
      const top3Planned = todayTasks.filter((task) => task.status !== "completed").length >= 3;
      const onePriorityDone = todayTasks.some((task) => task.priority === "high" && task.status === "completed");
      const northStarMetToday = top3Planned && onePriorityDone;

      const taskSpecificityScoreAvg = tasks.length > 0
        ? Math.round(
            tasks.reduce((sum, task) => {
              const title = (task.title || "").trim();
              const hasActionVerb = /^(write|review|call|plan|build|fix|update|send|prepare|draft|design|refactor|test)\b/i.test(title);
              const hasEnoughWords = title.split(/\s+/).filter(Boolean).length >= 3;
              const score = (hasActionVerb ? 50 : 0) + (hasEnoughWords ? 50 : 0);
              return sum + score;
            }, 0) / tasks.length,
          )
        : 0;

      const analytics = {
        tasksTotal: tasks.length,
        tasksCompleted,
        completionRate,
        highPriorityCompletionRate,
        habitsTotal: habits.length,
        habitEntriesTotal: habitEntries.length,
        habitsCompleted,
        habitCompletionRate,
        focusSessionsTotal: focusSessions.length,
        focusMinutesTotal,
        focusMinutesLast7Days,
        northStarMetToday,
        taskSpecificityScoreAvg,
        generatedAt: now.toISOString(),
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching productivity analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Feature flags API
  app.get("/api/features", authenticateToken, async (_req: AuthenticatedRequest, res) => {
    const parseFlag = (value: string | undefined, defaultValue: boolean) => {
      if (value === undefined) return defaultValue;
      return value.toLowerCase() === "true";
    };

    res.json({
      focusEngine: parseFlag(process.env.FEATURE_FOCUS_ENGINE, true),
      weeklyReview: parseFlag(process.env.FEATURE_WEEKLY_REVIEW, true),
      aiCoach: parseFlag(process.env.FEATURE_AI_COACH, true),
    });
  });

  // Telemetry events API
  app.post("/api/telemetry/events", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name, payload } = req.body || {};

      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Event name is required" });
      }

      // Scaffolding-only for now: log event safely so product can validate instrumentation.
      console.log("[telemetry]", {
        userId,
        name,
        payload: payload ?? {},
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error recording telemetry event:", error);
      res.status(500).json({ message: "Failed to record telemetry event" });
    }
  });

  // Focus blocks API
  app.get("/api/focus-blocks/active", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const activeBlock = await storage.getActiveFocusBlock(userId);
      res.json(activeBlock ? serializeActiveFocusBlock(activeBlock) : null);
    } catch (error) {
      console.error("Error fetching active focus block:", error);
      res.status(500).json({ message: "Failed to fetch active focus block" });
    }
  });

  app.post("/api/focus-blocks/start", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const activeBlock = await storage.getActiveFocusBlock(userId);
      if (activeBlock) {
        return res.status(409).json({ message: "A focus block is already active" });
      }

      const plannedDurationMin = Number(req.body?.plannedDurationMin);
      if (!Number.isFinite(plannedDurationMin) || plannedDurationMin <= 0 || plannedDurationMin > 240) {
        return res.status(400).json({ message: "plannedDurationMin must be between 1 and 240" });
      }

      const block = await storage.startFocusBlock(userId, plannedDurationMin);
      res.status(201).json(serializeActiveFocusBlock(block));
    } catch (error) {
      console.error("Error starting focus block:", error);
      res.status(500).json({ message: "Failed to start focus block" });
    }
  });

  app.put("/api/focus-blocks/:id/pause", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const blockId = Number(req.params.id);
      const block = await storage.pauseFocusBlock(userId, blockId);

      res.json(serializeActiveFocusBlock(block));
    } catch (error) {
      console.error("Error pausing focus block:", error);
      if (String((error as any)?.message || "").includes("not found")) {
        return res.status(404).json({ message: "Active focus block not found" });
      }
      res.status(500).json({ message: "Failed to pause focus block" });
    }
  });

  app.put("/api/focus-blocks/:id/resume", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const blockId = Number(req.params.id);
      const block = await storage.resumeFocusBlock(userId, blockId);

      res.json(serializeActiveFocusBlock(block));
    } catch (error) {
      console.error("Error resuming focus block:", error);
      if (String((error as any)?.message || "").includes("not found")) {
        return res.status(404).json({ message: "Active focus block not found" });
      }
      res.status(500).json({ message: "Failed to resume focus block" });
    }
  });

  app.put("/api/focus-blocks/:id/complete", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const blockId = Number(req.params.id);
      const qualityRatingRaw = req.body?.qualityRating;
      const qualityRating = Number.isFinite(Number(qualityRatingRaw))
        ? Number(qualityRatingRaw)
        : undefined;
      const block = await storage.completeFocusBlock(userId, blockId, qualityRating);

      res.json({
        message: "Focus block completed",
        completedSession: {
          duration: block.actualDurationSec,
          completedAt: block.completedAt,
          type: "focus_block",
        },
        interruptions: block.interruptions,
      });
    } catch (error) {
      console.error("Error completing focus block:", error);
      if (String((error as any)?.message || "").includes("not found")) {
        return res.status(404).json({ message: "Active focus block not found" });
      }
      res.status(500).json({ message: "Failed to complete focus block" });
    }
  });

  app.post("/api/focus-blocks/:id/interruptions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const blockId = Number(req.params.id);
      const interruptionType = String(req.body?.interruptionType || "internal");
      const note = req.body?.note ? String(req.body.note).slice(0, 200) : undefined;

      const interruption = await storage.addFocusInterruption(userId, blockId, interruptionType, note);
      res.status(201).json(interruption);
    } catch (error) {
      console.error("Error recording focus interruption:", error);
      if (String((error as any)?.message || "").includes("not found")) {
        return res.status(404).json({ message: "Active focus block not found" });
      }
      res.status(500).json({ message: "Failed to record interruption" });
    }
  });

  app.get("/api/focus-blocks", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
      const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;

      const focusBlocks = await storage.getFocusBlocks(userId, from, to);

      // Backward compatibility: include historical focus_block sessions if focus table has no records.
      if (focusBlocks.length === 0) {
        const sessions = await storage.getPomodoroSessions(userId);
        const legacyBlocks = sessions
          .filter((session) => session.type === "focus_block")
          .filter((session) => {
            const completedAt = new Date(session.completedAt);
            if (from && completedAt < from) return false;
            if (to && completedAt > to) return false;
            return true;
          })
          .map((session) => ({
            id: session.id,
            durationSeconds: session.duration,
            completedAt: session.completedAt,
            plannedDurationMin: null,
          }));
        return res.json(legacyBlocks);
      }

      res.json(
        focusBlocks.map((block) => ({
          id: block.id,
          durationSeconds: block.actualDurationSec || Math.max(60, Math.round(block.plannedDurationMin * 60)),
          completedAt: block.completedAt,
          plannedDurationMin: block.plannedDurationMin,
          qualityRating: block.qualityRating,
        })),
      );
    } catch (error) {
      console.error("Error fetching focus blocks:", error);
      res.status(500).json({ message: "Failed to fetch focus blocks" });
    }
  });

  // Team collaboration API
  app.get("/api/team/members", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // First, get the user's team
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        // If user has no team yet, create one for them
        const newTeam = await storage.createTeam({
          name: `${req.user!.name}'s Team`,
          description: "Personal productivity workspace",
          ownerId: userId
        });
        
        // Return the new team owner as the only member
        const members = await storage.getTeamMembers(newTeam.id);
        return res.json(members);
      }
      
      // Get existing team members
      const members = await storage.getTeamMembers(team.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/invitations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get the user's team
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.json([]);
      }
      
      // Get pending invitations for the team
      const invitations = await storage.getTeamInvitations(team.id);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching team invitations:", error);
      res.status(500).json({ message: "Failed to fetch team invitations" });
    }
  });

  app.post("/api/team/invite", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { email, role, inviterName } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      
      // Get the user's team
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }
      
      // Create the invitation (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createTeamInvitation({
        teamId: team.id,
        email,
        role: role || "member",
        invitedBy: userId,
        expiresAt
      });
      
      // Send invitation email
      try {
        const emailSent = await sendTeamInvitationEmail(email, inviterName || "Team Member", role || "member", invitation.id);
        if (emailSent) {
          console.log("✅ Team invitation email sent successfully to:", email);
        } else {
          console.log("⚠️ Team invitation email failed to send to:", email, "(continuing without email)");
        }
      } catch (emailError) {
        console.error("❌ Failed to send team invitation email:", emailError);
        console.log("⚠️ Continuing without email notification due to error");
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error sending team invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Delete team invitation
  app.delete("/api/team/invitations/:invitationId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const invitationId = parseInt(req.params.invitationId);
      
      // Get the user's team to verify they have permission
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }
      
      // Check if the current user has permission to delete invitations (must be owner or admin)
      const currentUserMember = await storage.getTeamMemberByUserAndTeam(userId, team.id);
      if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions to delete invitations" });
      }
      
      // Get the invitation to verify it belongs to this team
      const invitation = await storage.getTeamInvitationById(invitationId);
      if (!invitation || invitation.teamId !== team.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Delete the invitation
      await storage.deleteTeamInvitation(invitationId);
      
      // Send cancellation email notification
      try {
        // Get user name for email 
        const currentUser = await storage.getUserById(userId);
        await sendInvitationCancellationEmail(invitation.email, currentUser?.name || "Team Admin");
        console.log("✅ Invitation cancellation email sent to:", invitation.email);
      } catch (emailError) {
        console.error("❌ Failed to send cancellation email:", emailError);
        console.log("⚠️ Continuing without email notification due to error");
      }
      
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting team invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Get invitations sent TO the current user (by their email)
  app.get("/api/team/my-invitations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userEmail = req.user!.email;
      const invitations = await storage.getInvitationsByEmail(userEmail);

      // Enrich with team and inviter info
      const enriched = await Promise.all(invitations.map(async (inv) => {
        const inviter = await storage.getUserById(inv.invitedBy);
        const team = await storage.getTeamById(inv.teamId);
        return {
          ...inv,
          inviterName: inviter?.name || 'Someone',
          teamName: team?.name || 'a team',
        };
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching my invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Accept a team invitation
  app.post("/api/team/invitations/:invitationId/accept", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const userEmail = req.user!.email;
      const invitationId = parseInt(req.params.invitationId);

      const invitation = await storage.getTeamInvitationById(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ message: "This invitation was not sent to your email address" });
      }
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "This invitation has already been processed" });
      }
      if (new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "This invitation has expired" });
      }

      // Check not already a member
      const existing = await storage.getTeamMemberByUserAndTeam(userId, invitation.teamId);
      if (existing) {
        await storage.updateTeamInvitationStatus(invitationId, 'accepted');
        return res.json({ message: "You are already a member of this team", teamId: invitation.teamId });
      }

      // Mark accepted and add to team
      await storage.updateTeamInvitationStatus(invitationId, 'accepted');
      await storage.addTeamMember({ teamId: invitation.teamId, userId, role: invitation.role });

      res.json({ message: "Invitation accepted successfully", teamId: invitation.teamId });
    } catch (error) {
      console.error("Error accepting team invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Update team member role
  app.put("/api/team/members/:memberId/role", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const memberId = parseInt(req.params.memberId);
      const { role } = req.body;
      
      if (!role || !['viewer', 'member', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }
      
      // Get the user's team to verify they have permission
      const team = await storage.getTeamByUserId(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }
      
      // Check if the current user has permission to modify roles (must be owner or admin)
      const currentUserMember = await storage.getTeamMemberByUserAndTeam(userId, team.id);
      if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
        return res.status(403).json({ message: "Insufficient permissions to modify roles" });
      }
      
      // Cannot change owner role or modify owner's role
      const targetMember = await storage.getTeamMemberById(memberId);
      if (!targetMember || targetMember.role === 'owner') {
        return res.status(403).json({ message: "Cannot modify owner role" });
      }

      // SECURITY: Verify target member belongs to the same team
      if (targetMember.teamId !== team.id) {
        return res.status(403).json({ message: "Member does not belong to this team" });
      }

      // Update the role
      const updatedMember = await storage.updateTeamMemberRole(memberId, role);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Reset all user data
  app.delete("/api/user/reset-data", authenticateToken, async (req: AuthenticatedRequest, res) => {
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

  // Profile photo upload - get upload URL
  app.post("/api/profile/photo/upload-url", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting photo upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update profile photo after upload
  app.put("/api/profile/photo", authenticateToken, async (req: AuthenticatedRequest, res) => {
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
      
      // Make the photo publicly accessible
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        photoURL,
        {
          owner: String(userId),
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
        message: "Profile photo updated successfully"
      });
    } catch (error) {
      console.error("Error updating profile photo:", error);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  });

  // Video/demo content upload and serving
  
  // Serve public assets (including demo videos)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
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

  // Video upload endpoint for demo content
  app.post("/api/demo/upload", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update demo video URL after upload
  app.put("/api/demo/video", authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (!req.body.videoURL) {
      return res.status(400).json({ error: "videoURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.videoURL,
        {
          owner: "system",
          visibility: "public", // Demo videos should be publicly accessible
        },
      );

      // In a real app, you'd store this in the database
      // For now, we'll just return the path
      res.status(200).json({
        objectPath: objectPath,
        message: "Demo video uploaded successfully"
      });
    } catch (error) {
      console.error("Error setting demo video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Workspace Routes ─────────────────────────────────────────────────────

  const FRONTEND_URL_WS = process.env.FRONTEND_URL || "http://localhost:5000";
  const crypto = await import("crypto");

  const canManageWorkspace = (role: string) => ["owner", "admin"].includes(role);
  const canEditWorkspace = (role: string) => ["owner", "admin", "editor"].includes(role);

  async function assertWorkspaceMember(userId: number, workspaceId: number) {
    const member = await storage.getWorkspaceMember(workspaceId, userId);
    if (!member) throw Object.assign(new Error("Access denied"), { status: 403 });
    return member;
  }

  // GET /api/workspaces — list user's workspaces
  app.get("/api/workspaces", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const list = await storage.getWorkspacesByUser(req.user!.id);
      res.json(list);
    } catch (e) { res.status(500).json({ message: "Failed to fetch workspaces" }); }
  });

  // POST /api/workspaces — create workspace
  app.post("/api/workspaces", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name, description, color, icon, type } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
      const ws = await storage.createWorkspace({ name: name.trim(), description, color: color || "#6366f1", icon: icon || "folder", type: type === "personal" ? "personal" : "team", ownerId: userId, isArchived: false });
      await storage.logWorkspaceActivity({ workspaceId: ws.id, userId, action: "workspace_created", metadata: { name: ws.name } });
      res.json(ws);
    } catch (e: any) {
      console.error("Create workspace error:", e?.message || e);
      res.status(500).json({ message: e?.message || "Failed to create workspace" });
    }
  });

  // GET /api/workspaces/:id
  app.get("/api/workspaces/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      await assertWorkspaceMember(req.user!.id, wsId);
      const ws = await storage.getWorkspace(wsId);
      if (!ws) return res.status(404).json({ message: "Workspace not found" });
      res.json(ws);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // PUT /api/workspaces/:id
  app.put("/api/workspaces/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const { name, description, color, icon, type } = req.body;
      const ws = await storage.updateWorkspace(wsId, { name, description, color, icon, ...(type ? { type } : {}) });
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "workspace_updated", metadata: { name: ws.name } });
      res.json(ws);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // DELETE /api/workspaces/:id
  app.delete("/api/workspaces/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const ws = await storage.getWorkspace(wsId);
      if (!ws || ws.ownerId !== req.user!.id) return res.status(403).json({ message: "Only the owner can delete a workspace" });
      await storage.deleteWorkspace(wsId);
      res.json({ message: "Workspace deleted" });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // GET /api/workspaces/:id/members
  app.get("/api/workspaces/:id/members", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      await assertWorkspaceMember(req.user!.id, wsId);
      const members = await storage.getWorkspaceMembers(wsId);
      const enriched = await Promise.all(members.map(async m => {
        const user = await storage.getUserById(m.userId);
        return { ...m, name: user?.name || "Unknown", email: user?.email || "" };
      }));
      res.json(enriched);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // PUT /api/workspaces/:id/members/:userId/role
  app.put("/api/workspaces/:id/members/:userId/role", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id); const targetId = parseInt(req.params.userId);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const { role } = req.body;
      if (!["admin", "editor", "viewer"].includes(role)) return res.status(400).json({ message: "Invalid role" });
      const updated = await storage.updateWorkspaceMemberRole(wsId, targetId, role);
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "role_changed", targetUserId: targetId, metadata: { role } });
      res.json(updated);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // DELETE /api/workspaces/:id/members/:userId
  app.delete("/api/workspaces/:id/members/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id); const targetId = parseInt(req.params.userId);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (req.user!.id !== targetId && !canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      await storage.removeWorkspaceMember(wsId, targetId);
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "member_removed", targetUserId: targetId });
      res.json({ message: "Member removed" });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // GET /api/workspaces/:id/invitations
  app.get("/api/workspaces/:id/invitations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      res.json(await storage.getWorkspaceInvitations(wsId));
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // POST /api/workspaces/:id/invitations
  app.post("/api/workspaces/:id/invitations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const { email, role = "viewer" } = req.body;
      if (!email?.includes("@")) return res.status(400).json({ message: "Valid email required" });
      const ws = await storage.getWorkspace(wsId);
      const inviter = await storage.getUserById(req.user!.id);
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const inv = await storage.createWorkspaceInvitation({ workspaceId: wsId, email, role, token, invitedBy: req.user!.id, status: "pending", expiresAt });
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "member_invited", metadata: { email, role } });
      // Send email
      try {
        await sendEmail({
          to: email,
          from: getDisplayFromAddress("team"),
          subject: `${inviter?.name || "Someone"} invited you to ${ws?.name || "a workspace"} on Flowsstate`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h1 style="color:#6366f1">Flowsstate Workspace Invitation</h1>
            <p><strong>${inviter?.name}</strong> has invited you to join <strong>${ws?.name}</strong> as a <strong>${role}</strong>.</p>
            <div style="text-align:center;margin:30px 0">
              <a href="${FRONTEND_URL_WS}/join-workspace/${token}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Accept Invitation</a>
            </div>
            <p style="color:#64748b;font-size:13px">This invitation expires in 7 days. If you didn't expect this, you can ignore it.</p>
          </div>`
        });
      } catch (_) {}
      res.json(inv);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // DELETE /api/workspaces/:id/invitations/:invId
  app.delete("/api/workspaces/:id/invitations/:invId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      await storage.deleteWorkspaceInvitation(parseInt(req.params.invId));
      res.json({ message: "Invitation cancelled" });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // GET /api/my-workspace-invitations
  app.get("/api/my-workspace-invitations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const invitations = await storage.getWorkspaceInvitationsByEmail(req.user!.email);
      const enriched = await Promise.all(invitations.map(async inv => {
        const ws = await storage.getWorkspace(inv.workspaceId);
        const inviter = await storage.getUserById(inv.invitedBy);
        return { ...inv, workspaceName: ws?.name || "a workspace", workspaceColor: ws?.color || "#6366f1", inviterName: inviter?.name || "Someone" };
      }));
      res.json(enriched);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // POST /api/workspace-invitations/:token/accept
  app.post("/api/workspace-invitations/:token/accept", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const inv = await storage.getWorkspaceInvitationByToken(req.params.token);
      if (!inv) return res.status(404).json({ message: "Invitation not found" });
      if (inv.status !== "pending") return res.status(400).json({ message: "Invitation already used" });
      if (new Date() > new Date(inv.expiresAt)) return res.status(400).json({ message: "Invitation expired" });
      if (inv.email.toLowerCase() !== req.user!.email.toLowerCase()) return res.status(403).json({ message: "Email mismatch" });
      const existing = await storage.getWorkspaceMember(inv.workspaceId, req.user!.id);
      if (!existing) {
        await storage.addWorkspaceMember({ workspaceId: inv.workspaceId, userId: req.user!.id, role: inv.role });
        await storage.logWorkspaceActivity({ workspaceId: inv.workspaceId, userId: req.user!.id, action: "member_joined", metadata: { via: "email_invite" } });
      }
      await storage.updateWorkspaceInvitationStatus(inv.id, "accepted");
      res.json({ message: "Joined workspace", workspaceId: inv.workspaceId });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // POST /api/workspaces/:id/invite-links
  app.post("/api/workspaces/:id/invite-links", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const { role = "viewer", expiresInDays, maxUses } = req.body;
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined;
      const link = await storage.createWorkspaceInviteLink({ workspaceId: wsId, token, role, createdBy: req.user!.id, expiresAt, maxUses: maxUses || null, isActive: true });
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "invite_link_created", metadata: { role } });
      res.json({ ...link, url: `${FRONTEND_URL_WS}/join-workspace/${token}` });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // GET /api/workspaces/:id/invite-links
  app.get("/api/workspaces/:id/invite-links", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const links = await storage.getWorkspaceInviteLinks(wsId);
      res.json(links.map(l => ({ ...l, url: `${FRONTEND_URL_WS}/join-workspace/${l.token}` })));
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // DELETE /api/workspaces/:id/invite-links/:linkId
  app.delete("/api/workspaces/:id/invite-links/:linkId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canManageWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      await storage.deactivateInviteLink(parseInt(req.params.linkId));
      res.json({ message: "Link deactivated" });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // POST /api/workspace-join/:token — join via invite link
  app.post("/api/workspace-join/:token", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const link = await storage.getWorkspaceInviteLinkByToken(req.params.token);
      if (!link || !link.isActive) return res.status(404).json({ message: "Invite link not found or inactive" });
      if (link.expiresAt && new Date() > new Date(link.expiresAt)) return res.status(400).json({ message: "Invite link expired" });
      if (link.maxUses && link.useCount >= link.maxUses) return res.status(400).json({ message: "Invite link has reached max uses" });
      const existing = await storage.getWorkspaceMember(link.workspaceId, req.user!.id);
      if (!existing) {
        await storage.addWorkspaceMember({ workspaceId: link.workspaceId, userId: req.user!.id, role: link.role });
        await storage.logWorkspaceActivity({ workspaceId: link.workspaceId, userId: req.user!.id, action: "member_joined", metadata: { via: "invite_link" } });
        await db.update(workspaceInviteLinks).set({ useCount: link.useCount + 1 }).where(eq(workspaceInviteLinks.id, link.id));
      }
      res.json({ message: "Joined workspace", workspaceId: link.workspaceId });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // GET /api/workspaces/:id/content
  app.get("/api/workspaces/:id/content", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      await assertWorkspaceMember(req.user!.id, wsId);
      const content = await storage.getWorkspaceContent(wsId);
      const enriched = await Promise.all(content.map(async c => {
        const author = await storage.getUserById(c.authorId);
        return { ...c, authorName: author?.name || "Unknown" };
      }));
      res.json(enriched);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // POST /api/workspaces/:id/content
  app.post("/api/workspaces/:id/content", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canEditWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const { title, body = "", type = "note" } = req.body;
      if (!title?.trim()) return res.status(400).json({ message: "Title required" });
      const content = await storage.createWorkspaceContent({ workspaceId: wsId, authorId: req.user!.id, title: title.trim(), body, type, isPinned: false });
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "content_created", metadata: { title: content.title, type } });
      res.json(content);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // PUT /api/workspaces/:id/content/:contentId
  app.put("/api/workspaces/:id/content/:contentId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canEditWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      const { title, body, isPinned } = req.body;
      const updated = await storage.updateWorkspaceContent(parseInt(req.params.contentId), wsId, { title, body, isPinned });
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "content_updated", metadata: { title: updated.title } });
      res.json(updated);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // DELETE /api/workspaces/:id/content/:contentId
  app.delete("/api/workspaces/:id/content/:contentId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      const member = await assertWorkspaceMember(req.user!.id, wsId);
      if (!canEditWorkspace(member.role)) return res.status(403).json({ message: "Insufficient permissions" });
      await storage.deleteWorkspaceContent(parseInt(req.params.contentId), wsId);
      await storage.logWorkspaceActivity({ workspaceId: wsId, userId: req.user!.id, action: "content_deleted" });
      res.json({ message: "Deleted" });
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // GET /api/workspaces/:id/activity
  app.get("/api/workspaces/:id/activity", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const wsId = parseInt(req.params.id);
      await assertWorkspaceMember(req.user!.id, wsId);
      const activity = await storage.getWorkspaceActivity(wsId, 100);
      const enriched = await Promise.all(activity.map(async a => {
        const actor = a.userId ? await storage.getUserById(a.userId) : null;
        const target = a.targetUserId ? await storage.getUserById(a.targetUserId) : null;
        return { ...a, actorName: actor?.name || "System", targetName: target?.name };
      }));
      res.json(enriched);
    } catch (e: any) { res.status(e.status || 500).json({ message: e.message }); }
  });

  // ─────────────────────────────────────────────────────────────────────────

  const httpServer = createServer(app);
  return httpServer;
}
