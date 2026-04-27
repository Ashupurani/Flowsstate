import { useState } from "react";
import { Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Habit } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface HabitEditDialogProps {
  habit: Habit;
}

const iconOptions = [
  { value: "fas fa-tint", label: "Water Drop" },
  { value: "fas fa-dumbbell", label: "Dumbbell" },
  { value: "fas fa-book", label: "Book" },
  { value: "fas fa-leaf", label: "Leaf" },
  { value: "fas fa-heart", label: "Heart" },
  { value: "fas fa-brain", label: "Brain" },
  { value: "fas fa-moon", label: "Moon" },
  { value: "fas fa-sun", label: "Sun" },
  { value: "fas fa-coffee", label: "Coffee" },
  { value: "fas fa-apple-alt", label: "Apple" },
  { value: "fas fa-running", label: "Running" },
  { value: "fas fa-meditation", label: "Meditation" },
];

const colorOptions = [
  { value: "blue-500", label: "Blue", color: "bg-blue-500" },
  { value: "green-500", label: "Green", color: "bg-green-500" },
  { value: "purple-500", label: "Purple", color: "bg-purple-500" },
  { value: "red-500", label: "Red", color: "bg-red-500" },
  { value: "yellow-500", label: "Yellow", color: "bg-yellow-500" },
  { value: "pink-500", label: "Pink", color: "bg-pink-500" },
  { value: "indigo-500", label: "Indigo", color: "bg-indigo-500" },
  { value: "orange-500", label: "Orange", color: "bg-orange-500" },
];

const habitFormSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
});

export default function HabitEditDialog({ habit }: HabitEditDialogProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateHabitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof habitFormSchema>) => {
      return apiRequest("PUT", `/api/habits/${habit.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsEditOpen(false);
      toast({
        title: "Habit updated",
        description: "Your habit has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/habits/${habit.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-entries"] });
      setIsDeleteOpen(false);
      toast({
        title: "Habit deleted",
        description: "Your habit has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
    },
  });

  const onSubmit = (values: z.infer<typeof habitFormSchema>) => {
    updateHabitMutation.mutate(values);
  };

  const handleDelete = () => {
    deleteHabitMutation.mutate();
  };

  return (
    <div className="flex items-center space-x-1">
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={12} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Drink Water" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center space-x-2">
                              <i className={`${icon.value} w-4 h-4`} />
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full ${color.color}`} />
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateHabitMutation.isPending}>
                  {updateHabitMutation.isPending ? "Updating..." : "Update Habit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600">
            <Trash2 size={12} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Delete Habit</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habit.name}"? This will also delete all completion records for this habit. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteHabitMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteHabitMutation.isPending ? "Deleting..." : "Delete Habit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}