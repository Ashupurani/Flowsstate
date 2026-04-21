export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'streak' | 'milestone' | 'special';
  requirement: number;
  habitId?: number;
}

export const STREAK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak_3',
    title: 'Getting Started!',
    description: 'Complete a habit for 3 days in a row',
    icon: 'fas fa-seedling',
    color: 'green',
    type: 'streak',
    requirement: 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Complete a habit for 7 days in a row',
    icon: 'fas fa-trophy',
    color: 'yellow',
    type: 'streak',
    requirement: 7,
  },
  {
    id: 'streak_14',
    title: 'Two Week Champion',
    description: 'Complete a habit for 14 days in a row',
    icon: 'fas fa-medal',
    color: 'orange',
    type: 'streak',
    requirement: 14,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Complete a habit for 30 days in a row',
    icon: 'fas fa-crown',
    color: 'purple',
    type: 'streak',
    requirement: 30,
  },
];

export const SPECIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'all_habits_today',
    title: 'Perfect Day',
    description: 'Complete all habits in a single day',
    icon: 'fas fa-star',
    color: 'blue',
    type: 'special',
    requirement: 1,
  },
  {
    id: 'weekly_completion',
    title: 'Weekly Perfectionist',
    description: 'Complete all habits every day for a week',
    icon: 'fas fa-gem',
    color: 'purple',
    type: 'special',
    requirement: 7,
  },
];

export function getStreakLength(habitEntries: any[], habitId: number): number {
  const today = new Date();
  let currentStreak = 0;
  let consecutiveDays = 0;
  
  // Check from today backwards
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateString = checkDate.toISOString().split('T')[0];
    
    const hasEntry = habitEntries.some(entry => 
      entry.habitId === habitId && 
      entry.date === dateString && 
      entry.completed
    );
    
    if (hasEntry) {
      consecutiveDays++;
    } else {
      // If we haven't started counting yet (first day), continue
      if (consecutiveDays === 0 && i === 0) {
        continue;
      }
      // Otherwise, stop counting
      break;
    }
  }
  
  return consecutiveDays;
}

export function getEarnedAchievements(habitEntries: any[], habits: any[]): Achievement[] {
  const earned: Achievement[] = [];
  
  // Check streak achievements for each habit
  habits.forEach(habit => {
    const streakLength = getStreakLength(habitEntries, habit.id);
    
    STREAK_ACHIEVEMENTS.forEach(achievement => {
      if (streakLength >= achievement.requirement) {
        earned.push({
          ...achievement,
          id: `${achievement.id}_${habit.id}`,
          habitId: habit.id,
          title: `${achievement.title} - ${habit.name}`,
        });
      }
    });
    
    // Check for custom habit goals
    if (habit.streakGoal && streakLength >= habit.streakGoal) {
      earned.push({
        id: `custom_goal_${habit.id}`,
        title: `${habit.name} Goal Achieved!`,
        description: `Completed ${habit.name} for ${habit.streakGoal} days in a row`,
        icon: habit.icon,
        color: habit.color,
        type: 'milestone',
        requirement: habit.streakGoal,
        habitId: habit.id,
      });
    }
  });
  
  // Check special achievements
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = habitEntries.filter(entry => 
    entry.date === today && entry.completed
  );
  
  if (todayEntries.length === habits.length && habits.length > 0) {
    earned.push(SPECIAL_ACHIEVEMENTS.find(a => a.id === 'all_habits_today')!);
  }
  
  return earned;
}