import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCalendarStore } from "@/lib/store";
import { z } from "zod";

// Helper to calculate week key from any date
const calculateWeekKey = (date: Date): string => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString().split('T')[0];
};

// Helper to get week label from weekKey
const getWeekLabel = (weekKey: string): string => {
  const startDate = new Date(weekKey);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

interface TaskModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  editingTask?: Task | null;
  defaultDay?: string;
}

export default function TaskModal({ isOpen = false, onClose, editingTask, defaultDay = "monday" }: TaskModalProps) {
  const [open, setOpen] = useState(isOpen);
  const queryClient = useQueryClient();
  const { getWeekKey } = useCalendarStore();
  const isEditing = !!editingTask;
  
  // State for week selection - allows moving tasks across weeks
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(getWeekKey());

  // Navigate to previous/next week in the picker
  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentWeekStart = new Date(selectedWeekKey + 'T12:00:00'); // Add time to avoid timezone issues
    console.log('Week navigation:', direction, 'from', selectedWeekKey);
    if (direction === 'prev') {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    } else {
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    const newWeekKey = calculateWeekKey(currentWeekStart);
    console.log('New week key:', newWeekKey);
    setSelectedWeekKey(newWeekKey);
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const taskData = {
        ...data,
        weekKey: selectedWeekKey, // Use selected week key (allows cross-week task creation)
        originalWeek: selectedWeekKey // Track original week
      };
      console.log('Sending task data to API:', taskData);
      return apiRequest("/api/tasks", { method: "POST", body: JSON.stringify(taskData) });
    },
    onSuccess: (result) => {
      console.log('Task created successfully:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      const currentWeekKey = getWeekKey();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/week", currentWeekKey] });
      handleClose();
    },
    onError: (error) => {
      console.error('Task creation failed:', error);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const updateData = {
        ...data,
        weekKey: selectedWeekKey, // Allow moving task to different week
      };
      console.log('Updating task:', editingTask!.id, updateData);
      return apiRequest(`/api/tasks/${editingTask!.id}`, { method: "PUT", body: JSON.stringify(updateData) });
    },
    onSuccess: (result) => {
      console.log('Task updated successfully:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      const currentWeekKey = getWeekKey();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/week", currentWeekKey] });
      handleClose();
    },
    onError: (error) => {
      console.error('Task update failed:', error);
    },
  });

  const formSchema = insertTaskSchema.omit({ weekKey: true, userId: true });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "",
      priority: "medium",
      status: "proposed",
      dayOfWeek: defaultDay,
      notes: "",
    },
  });

  // Update modal open state when props change
  useEffect(() => {
    console.log('Modal isOpen effect triggered:', isOpen);
    setOpen(isOpen);
  }, [isOpen]);

  // Reset form when editing task changes or modal opens/closes
  useEffect(() => {
    if (editingTask) {
      console.log('Resetting form for editing task:', editingTask.title);
      form.reset({
        title: editingTask.title,
        category: editingTask.category,
        priority: editingTask.priority,
        status: editingTask.status,
        dayOfWeek: editingTask.dayOfWeek,
        notes: editingTask.notes || "",
      });
      // Set the week to the task's current week when editing
      setSelectedWeekKey(editingTask.weekKey || getWeekKey());
    } else if (isOpen) {
      console.log('Resetting form for new task, defaultDay:', defaultDay);
      form.reset({
        title: "",
        category: "",
        priority: "medium",
        status: "proposed",
        dayOfWeek: defaultDay,
        notes: "",
      });
      // Reset to current week when creating new task
      setSelectedWeekKey(getWeekKey());
    }
  }, [editingTask, isOpen, defaultDay, form, getWeekKey]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
    form.reset();
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Task form submitted:', values);
    console.log('Current week key:', getWeekKey());
    console.log('Is editing:', isEditing);
    
    if (isEditing) {
      console.log('Updating task:', editingTask?.id);
      updateTaskMutation.mutate(values);
    } else {
      console.log('Creating new task');
      createTaskMutation.mutate(values);
    }
  };

  // Global event handlers for opening modal (can be triggered from other components)
  if (typeof window !== 'undefined') {
    (window as any).openTaskModal = () => setOpen(true);
    (window as any).openTaskEditModal = (task: Task) => {
      form.reset({
        title: task.title,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dayOfWeek: task.dayOfWeek,
        notes: task.notes || "",
      });
      setOpen(true);
    };
  }

  console.log('TaskModal render - open:', open, 'isOpen prop:', isOpen, 'editingTask:', !!editingTask);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('Dialog onOpenChange:', newOpen);
      setOpen(newOpen);
      if (!newOpen && onClose) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? 'Edit Task' : 'Add New Task'}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                    </FormControl>
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
                </FormItem>
              )}
            />

            {/* Week Picker - allows moving tasks across weeks */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Week</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek('prev')}
                  data-testid="button-prev-week"
                >
                  <ChevronLeft size={16} />
                </Button>
                <div className="flex-1 text-center text-sm font-medium px-3 py-2 border rounded-md bg-muted/50">
                  {getWeekLabel(selectedWeekKey)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek('next')}
                  data-testid="button-next-week"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use arrows to move task to a different week
              </p>
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dev, Marketing, Personal" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={3} {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="in_task">In Task</SelectItem>
                      <SelectItem value="hurdles">Hurdles</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isEditing ? updateTaskMutation.isPending : createTaskMutation.isPending}
              >
                {isEditing 
                  ? (updateTaskMutation.isPending ? "Updating..." : "Update Task")
                  : (createTaskMutation.isPending ? "Creating..." : "Create Task")
                }
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
