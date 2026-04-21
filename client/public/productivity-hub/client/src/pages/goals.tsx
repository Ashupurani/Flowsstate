import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Target, Plus, Trophy, Pencil, Trash2, TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import Header from "@/components/header";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: number;
  title: string;
  description: string | null;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  priority: string;
  status: string;
  createdAt: string;
}

const CATEGORIES = ["Work", "Health", "Learning", "Finance", "Personal", "Fitness", "Creativity", "Relationships"];
const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  high: { label: "High", color: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  medium: { label: "Medium", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  low: { label: "Low", color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
};

function getMotivationMessage(pct: number): string {
  if (pct === 0) return "Every journey begins with a single step.";
  if (pct < 25) return "You've started — keep the momentum going!";
  if (pct < 50) return "Making real progress. Don't stop now!";
  if (pct < 75) return "Over halfway there! The finish line is in sight.";
  if (pct < 100) return "So close! Push through to the end!";
  return "Goal achieved! Outstanding work!";
}

function getDaysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DaysLeftBadge({ deadline }: { deadline: string }) {
  const days = getDaysLeft(deadline);
  if (days < 0) return <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={11} /> Overdue</span>;
  if (days === 0) return <span className="text-xs text-red-500 font-medium">Due today</span>;
  if (days <= 3) return <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"><Clock size={11} /> {days}d left</span>;
  return <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={11} /> {days}d left</span>;
}

interface GoalFormValues {
  title: string;
  description: string;
  category: string;
  targetValue: string | number;
  currentValue: string | number;
  unit: string;
  deadline: string;
  priority: string;
  status?: string;
}

interface GoalFormProps {
  values: GoalFormValues;
  onChange: (updates: Partial<GoalFormValues>) => void;
  showStatus?: boolean;
}

function GoalForm({ values, onChange, showStatus }: GoalFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Title *</Label>
        <Input
          placeholder="e.g. Read 12 books this year"
          value={values.title}
          onChange={e => onChange({ title: e.target.value })}
          data-testid="input-goal-title"
          autoFocus
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Why this goal? (optional)</Label>
        <Textarea
          placeholder="Your motivation — why does this matter to you?"
          value={values.description ?? ""}
          onChange={e => onChange({ description: e.target.value })}
          className="resize-none h-16 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Category *</Label>
          <Select value={values.category} onValueChange={v => onChange({ category: v })}>
            <SelectTrigger data-testid="select-goal-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Priority *</Label>
          <Select value={values.priority} onValueChange={v => onChange({ priority: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Target *</Label>
          <Input
            type="number"
            placeholder="e.g. 12"
            value={values.targetValue}
            onChange={e => onChange({ targetValue: e.target.value })}
            data-testid="input-goal-target"
            min={1}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Unit *</Label>
          <Input
            placeholder="e.g. books, km, hours"
            value={values.unit}
            onChange={e => onChange({ unit: e.target.value })}
            data-testid="input-goal-unit"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Current progress</Label>
          <Input
            type="number"
            placeholder="0"
            value={values.currentValue}
            onChange={e => onChange({ currentValue: e.target.value })}
            min={0}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Deadline *</Label>
          <Input
            type="date"
            value={values.deadline}
            onChange={e => onChange({ deadline: e.target.value })}
            data-testid="input-goal-deadline"
          />
        </div>
      </div>
      {showStatus && (
        <div>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</Label>
          <Select value={values.status ?? "active"} onValueChange={v => onChange({ status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM: GoalFormValues = {
  title: "",
  description: "",
  category: "Work",
  targetValue: "",
  currentValue: "",
  unit: "",
  deadline: "",
  priority: "medium",
};

export default function Goals() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalFormValues & { id: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Goal | null>(null);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [progressAmount, setProgressAmount] = useState("1");
  const [form, setForm] = useState<GoalFormValues>(EMPTY_FORM);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalFormValues) => apiRequest("/api/goals", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        targetValue: Number(data.targetValue),
        currentValue: Number(data.currentValue || 0),
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Goal created", description: "Track your progress and make it happen." });
    },
    onError: () => toast({ title: "Failed to create goal", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Goal> }) =>
      apiRequest(`/api/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setEditGoal(null);
      setProgressGoal(null);
      toast({ title: "Goal updated" });
    },
    onError: () => toast({ title: "Failed to update goal", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setDeleteConfirm(null);
      toast({ title: "Goal deleted" });
    },
    onError: () => toast({ title: "Failed to delete goal", variant: "destructive" }),
  });

  const activeGoals = goals.filter(g => g.currentValue < g.targetValue && g.status !== "completed");
  const completedGoals = goals.filter(g => g.currentValue >= g.targetValue || g.status === "completed");
  const allCategories = ["All", ...Array.from(new Set(goals.map(g => g.category)))];
  const filtered = (list: Goal[]) =>
    activeCategory === "All" ? list : list.filter(g => g.category === activeCategory);

  const handleCreate = () => {
    if (!form.title.trim() || !form.targetValue || !form.unit.trim() || !form.deadline || !form.category) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const handleEdit = () => {
    if (!editGoal) return;
    updateMutation.mutate({
      id: editGoal.id,
      updates: {
        title: editGoal.title,
        description: editGoal.description || null,
        category: editGoal.category,
        targetValue: Number(editGoal.targetValue),
        currentValue: Number(editGoal.currentValue),
        unit: editGoal.unit,
        deadline: editGoal.deadline,
        priority: editGoal.priority,
        status: editGoal.status ?? "active",
      },
    });
  };

  const handleLogProgress = () => {
    if (!progressGoal) return;
    const amount = parseFloat(progressAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newValue = Math.min(progressGoal.currentValue + amount, progressGoal.targetValue);
    updateMutation.mutate({
      id: progressGoal.id,
      updates: {
        currentValue: newValue,
        status: newValue >= progressGoal.targetValue ? "completed" : "active",
      },
    });
    setProgressAmount("1");
  };

  const openEdit = (goal: Goal) => {
    setEditGoal({
      id: goal.id,
      title: goal.title,
      description: goal.description ?? "",
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      deadline: goal.deadline,
      priority: goal.priority,
      status: goal.status,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set targets, track progress, achieve more</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-add-goal">
            <Plus size={16} className="mr-1" />
            New Goal
          </Button>
        </div>

        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
              <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
              <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Completed</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
              <p className="text-2xl font-bold text-purple-600">
                {goals.length > 0
                  ? Math.round(goals.reduce((sum, g) => sum + Math.min((g.currentValue / g.targetValue) * 100, 100), 0) / goals.length)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Avg Progress</p>
            </div>
          </div>
        )}

        {goals.length > 1 && allCategories.length > 2 && (
          <div className="flex gap-2 flex-wrap">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-xl animate-pulse border border-gray-100 dark:border-slate-700" />
            ))}
          </div>
        )}

        {!isLoading && filtered(activeGoals).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">In Progress</h2>
            {filtered(activeGoals).map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEdit}
                onDelete={setDeleteConfirm}
                onProgress={setProgressGoal}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered(completedGoals).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Trophy size={14} className="text-green-500" /> Completed
            </h2>
            {filtered(completedGoals).map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEdit}
                onDelete={setDeleteConfirm}
                onProgress={setProgressGoal}
              />
            ))}
          </div>
        )}

        {!isLoading && goals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No goals yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Set a clear target with a deadline and start tracking your progress toward what matters most.
            </p>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-add-first-goal">
              <Plus size={16} className="mr-2" />
              Set Your First Goal
            </Button>
          </div>
        )}
      </main>

      <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Goal</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <GoalForm values={form} onChange={u => setForm(prev => ({ ...prev, ...u }))} />
            <Button
              className="w-full mt-4"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              data-testid="button-create-goal"
            >
              {createMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editGoal} onOpenChange={open => !open && setEditGoal(null)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {editGoal && (
            <div className="pt-2">
              <GoalForm
                values={editGoal}
                onChange={u => setEditGoal(prev => prev ? { ...prev, ...u } : null)}
                showStatus
              />
              <Button
                className="w-full mt-4"
                onClick={handleEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!progressGoal} onOpenChange={open => !open && setProgressGoal(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Log Progress</DialogTitle>
          </DialogHeader>
          {progressGoal && (
            <div className="pt-2 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">{progressGoal.title}</span>
                <br />
                Current: {progressGoal.currentValue} / {progressGoal.targetValue} {progressGoal.unit}
              </p>
              <div>
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Add progress ({progressGoal.unit})
                </Label>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  value={progressAmount}
                  onChange={e => setProgressAmount(e.target.value)}
                  data-testid="input-progress-amount"
                  onKeyDown={e => e.key === "Enter" && handleLogProgress()}
                  autoFocus
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                New total: {Math.min(progressGoal.currentValue + parseFloat(progressAmount || "0"), progressGoal.targetValue).toFixed(1)} / {progressGoal.targetValue} {progressGoal.unit}
              </div>
              <Button
                className="w-full"
                onClick={handleLogProgress}
                disabled={updateMutation.isPending}
                data-testid="button-log-progress"
              >
                {updateMutation.isPending ? "Saving..." : "Log Progress"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Goal?</DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will permanently delete <span className="font-medium text-gray-900 dark:text-white">"{deleteConfirm?.title}"</span>. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onProgress: (goal: Goal) => void;
}

function GoalCard({ goal, onEdit, onDelete, onProgress }: GoalCardProps) {
  const pct = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  const p = PRIORITY_CONFIG[goal.priority] ?? PRIORITY_CONFIG.medium;
  const isDone = pct >= 100;

  return (
    <Card className={`transition-all hover:shadow-md ${isDone ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : ""}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-xs shrink-0">{goal.category}</Badge>
              <span className={`text-xs font-medium flex items-center gap-1 ${p.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                {p.label}
              </span>
              {isDone && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{goal.title}</h3>
            {goal.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onProgress(goal)} title="Log progress">
              <TrendingUp size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(goal)} title="Edit goal">
              <Pencil size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => onDelete(goal)} title="Delete goal">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {goal.currentValue} / {goal.targetValue} <span className="text-gray-400">{goal.unit}</span>
            </span>
            <div className="flex items-center gap-3">
              <DaysLeftBadge deadline={goal.deadline} />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{pct.toFixed(0)}%</span>
            </div>
          </div>
          <Progress value={pct} className={`h-2 ${isDone ? "[&>div]:bg-green-500" : ""}`} />
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">{getMotivationMessage(pct)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
