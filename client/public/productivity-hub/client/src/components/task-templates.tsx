import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useCalendarStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Trash2, Repeat, Clock } from 'lucide-react';

interface TaskTemplate {
  id: string;
  title: string;
  category: string;
  priority: string;
  recurrence: 'daily' | 'weekdays' | 'weekly' | 'none';
  dayOfWeek?: string;
}

const STORAGE_KEY = 'task-templates';

export default function TaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState<Partial<TaskTemplate>>({
    title: '',
    category: 'general',
    priority: 'medium',
    recurrence: 'none',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const getWeekKey = useCalendarStore(state => state.getWeekKey);
  const selectedDate = useCalendarStore(state => state.selectedDate);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  }, []);

  const saveTemplates = (updated: TaskTemplate[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTemplates(updated);
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; priority: string; dayOfWeek: string; weekKey: string }) => {
      return apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          status: 'proposed',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const getDayOfWeek = () => {
    const date = selectedDate || new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  const getWeekdays = (): string[] => {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  };

  const handleAddTemplate = () => {
    if (!newTemplate.title?.trim()) return;
    
    const template: TaskTemplate = {
      id: Date.now().toString(),
      title: newTemplate.title.trim(),
      category: newTemplate.category || 'general',
      priority: newTemplate.priority || 'medium',
      recurrence: newTemplate.recurrence || 'none',
      dayOfWeek: newTemplate.dayOfWeek,
    };
    
    saveTemplates([...templates, template]);
    setNewTemplate({ title: '', category: 'general', priority: 'medium', recurrence: 'none' });
    toast({ title: 'Template saved', description: template.title });
  };

  const handleDeleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
    toast({ title: 'Template deleted' });
  };

  const handleUseTemplate = async (template: TaskTemplate) => {
    const weekKey = getWeekKey();
    
    if (template.recurrence === 'daily') {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        await createTaskMutation.mutateAsync({
          title: template.title,
          category: template.category,
          priority: template.priority,
          dayOfWeek: day,
          weekKey,
        });
      }
      toast({ title: 'Created 7 tasks', description: `One for each day of the week` });
    } else if (template.recurrence === 'weekdays') {
      for (const day of getWeekdays()) {
        await createTaskMutation.mutateAsync({
          title: template.title,
          category: template.category,
          priority: template.priority,
          dayOfWeek: day,
          weekKey,
        });
      }
      toast({ title: 'Created 5 tasks', description: `One for each weekday` });
    } else if (template.recurrence === 'weekly' && template.dayOfWeek) {
      await createTaskMutation.mutateAsync({
        title: template.title,
        category: template.category,
        priority: template.priority,
        dayOfWeek: template.dayOfWeek,
        weekKey,
      });
      toast({ title: 'Task created', description: `Added to ${template.dayOfWeek}` });
    } else {
      await createTaskMutation.mutateAsync({
        title: template.title,
        category: template.category,
        priority: template.priority,
        dayOfWeek: getDayOfWeek(),
        weekKey,
      });
      toast({ title: 'Task created', description: template.title });
    }
  };

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case 'daily': return 'Every day';
      case 'weekdays': return 'Mon-Fri';
      case 'weekly': return 'Weekly';
      default: return 'One-time';
    }
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Task Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Create New Template</h4>
            <Input
              placeholder="Task title..."
              value={newTemplate.title || ''}
              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={newTemplate.category}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="dev">Dev</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newTemplate.priority}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select
              value={newTemplate.recurrence}
              onValueChange={(value: any) => setNewTemplate({ ...newTemplate, recurrence: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time</SelectItem>
                <SelectItem value="daily">Every day (7 tasks)</SelectItem>
                <SelectItem value="weekdays">Weekdays only (5 tasks)</SelectItem>
                <SelectItem value="weekly">Weekly (pick a day)</SelectItem>
              </SelectContent>
            </Select>
            {newTemplate.recurrence === 'weekly' && (
              <Select
                value={newTemplate.dayOfWeek}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, dayOfWeek: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day of week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleAddTemplate} disabled={!newTemplate.title?.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>

          {templates.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Your Templates</h4>
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{template.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Badge className={`text-xs ${priorityColors[template.priority]}`}>
                            {template.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRecurrenceLabel(template.recurrence)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUseTemplate(template)}
                          disabled={createTaskMutation.isPending}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {templates.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No templates yet. Create one above to quickly add recurring tasks!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
