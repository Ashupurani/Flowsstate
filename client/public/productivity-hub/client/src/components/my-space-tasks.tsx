import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Kanban, CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

interface AssignedTask {
  id: number;
  workspaceId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  workspaceName: string;
  workspaceColor: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  medium: { label: "Med",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  high:   { label: "High",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const STATUS_ICON: Record<string, JSX.Element> = {
  proposed:  <Circle size={13} className="text-slate-400" />,
  in_task:   <Clock size={13} className="text-blue-500" />,
  hurdles:   <AlertCircle size={13} className="text-red-500" />,
  completed: <CheckCircle2 size={13} className="text-emerald-500" />,
};

export default function MySpaceTasks() {
  const { data: tasks = [], isLoading } = useQuery<AssignedTask[]>({
    queryKey: ["/api/my-assigned-tasks"],
    refetchInterval: 60_000,
  });

  const open = tasks.filter(t => t.status !== "completed");
  const done = tasks.filter(t => t.status === "completed");

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Kanban size={15} className="text-indigo-500" />
          <span className="font-semibold text-sm">Assigned to Me from Spaces</span>
          {open.length > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
              {open.length} open
            </span>
          )}
        </div>
        <Link href="/workspace">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1">
            Go to Spaces <ExternalLink size={11} />
          </Button>
        </Link>
      </div>

      {/* Body */}
      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Kanban size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No tasks assigned to you yet.</p>
            <p className="text-xs mt-1">Head to Spaces to join a team board.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {open.map(task => <TaskRow key={task.id} task={task} />)}
            {done.length > 0 && open.length > 0 && (
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-2 pb-1">
                Completed
              </div>
            )}
            {done.slice(0, 3).map(task => <TaskRow key={task.id} task={task} muted />)}
            {done.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{done.length - 3} more completed</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, muted = false }: { task: AssignedTask; muted?: boolean }) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const statusIcon = STATUS_ICON[task.status] ?? STATUS_ICON.proposed;
  const isOverdue = task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date();

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors ${muted ? "opacity-50" : ""}`}>
      {/* Workspace color dot */}
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.workspaceColor }} />

      {/* Status icon */}
      <span className="flex-shrink-0">{statusIcon}</span>

      {/* Title + space name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{task.title}</p>
        <p className="text-[10px] text-muted-foreground">{task.workspaceName}</p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priority.cls}`}>
          {priority.label}
        </span>
        {task.dueDate && (
          <span className={`text-[10px] ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            {task.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}
