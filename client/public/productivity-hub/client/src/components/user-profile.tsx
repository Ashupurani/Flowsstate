import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const userProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    notifications: z.boolean().default(true),
    timezone: z.string().default("UTC"),
  }).optional(),
});

type UserProfile = z.infer<typeof userProfileSchema>;

interface UserProfileProps {
  onSave?: (profile: UserProfile) => void;
}

export default function UserProfile({ onSave }: UserProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    preferences: {
      theme: "system",
      notifications: true,
      timezone: "UTC",
    },
  });

  const form = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: profile,
  });

  // Load profile from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        form.reset(parsed);
      } catch (error) {
        console.error("Failed to parse saved profile:", error);
      }
    }
  }, [form]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: UserProfile) => {
      // Save to localStorage for now (can be extended to API later)
      localStorage.setItem("userProfile", JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      setProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      if (onSave) {
        onSave(data);
      }
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: UserProfile) => {
    saveProfileMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={saveProfileMutation.isPending}
        >
          {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}

export { userProfileSchema, type UserProfile };