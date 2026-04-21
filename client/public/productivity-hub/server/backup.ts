import { storage } from './storage';
import fs from 'fs';
import path from 'path';

export interface BackupData {
  timestamp: string;
  users: any[];
  tasks: any[];
  habits: any[];
  habitEntries: any[];
  pomodoroSessions: any[];
  goals: any[];
  metadata: {
    version: string;
    totalRecords: number;
  };
}

export async function createDataBackup(userId: number): Promise<BackupData> {
  try {
    const timestamp = new Date().toISOString();
    
    // Get all user data
    const user = await storage.getUserById(userId);
    const tasks = await storage.getTasks(userId);
    const habits = await storage.getHabits(userId);
    const habitEntries = await storage.getHabitEntries(userId);
    const pomodoroSessions = await storage.getPomodoroSessions(userId);
    
    const backupData: BackupData = {
      timestamp,
      users: user ? [user] : [],
      tasks,
      habits,
      habitEntries,
      pomodoroSessions,
      goals: [], // Add goals when implemented
      metadata: {
        version: '1.0.0',
        totalRecords: tasks.length + habits.length + habitEntries.length + pomodoroSessions.length
      }
    };

    return backupData;
  } catch (error) {
    console.error('Backup creation failed:', error);
    throw new Error('Failed to create backup');
  }
}

export async function exportUserData(userId: number): Promise<string> {
  const backup = await createDataBackup(userId);
  const filename = `productivity_backup_${userId}_${backup.timestamp.split('T')[0]}.json`;
  
  return JSON.stringify(backup, null, 2);
}

export async function saveBackupToFile(userId: number): Promise<string> {
  const backupData = await exportUserData(userId);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `backup_user_${userId}_${timestamp}.json`;
  const filepath = path.join(process.cwd(), 'backups', filename);
  
  // Create backups directory if it doesn't exist
  const backupDir = path.dirname(filepath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, backupData);
  return filepath;
}