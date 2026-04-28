import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// API rate limiter — only applies to /api/* routes, not static assets
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith("/api"),
});
app.use(apiLimiter);

// Stricter limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later.",
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// Inline schema migrations — runs before routes, ensures columns exist
// without relying on drizzle-kit push being interactive-safe.
async function runSchemaMigrations() {
  const client = await pool.connect();
  try {
    // Create workspace tables if they don't exist yet
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#6366f1',
        icon TEXT NOT NULL DEFAULT 'folder',
        type TEXT NOT NULL DEFAULT 'team',
        owner_id INTEGER NOT NULL,
        is_archived BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_active TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_invitations (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        token TEXT NOT NULL UNIQUE,
        invited_by INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_invite_links (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'viewer',
        created_by INTEGER NOT NULL,
        expires_at TIMESTAMP,
        max_uses INTEGER,
        use_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_content (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'note',
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_activity (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_user_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_tasks (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'proposed',
        priority TEXT NOT NULL DEFAULT 'medium',
        assigned_to INTEGER,
        due_date TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Ensure the type column exists on workspaces (added after initial release)
    await client.query(`
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'team'
    `);

    // Labels on workspace tasks
    await client.query(`
      ALTER TABLE workspace_tasks ADD COLUMN IF NOT EXISTS labels JSONB NOT NULL DEFAULT '[]'
    `);

    // Custom columns per workspace
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_columns (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#94a3b8',
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Subtasks per task
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_subtasks (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Comments per task
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Seed default columns for any workspace that doesn't have them yet
    await client.query(`
      INSERT INTO workspace_columns (workspace_id, key, name, color, position)
      SELECT w.id, cols.key, cols.name, cols.color, cols.position
      FROM workspaces w
      CROSS JOIN (VALUES
        ('proposed',  'Proposed',    '#94a3b8', 0),
        ('in_task',   'In Progress', '#3b82f6', 1),
        ('hurdles',   'Hurdles',     '#ef4444', 2),
        ('completed', 'Completed',   '#10b981', 3)
      ) AS cols(key, name, color, position)
      WHERE NOT EXISTS (
        SELECT 1 FROM workspace_columns wc WHERE wc.workspace_id = w.id
      )
    `);

    log('Schema migrations complete');
  } catch (e: any) {
    log(`Schema migration warning: ${e.message}`);
  } finally {
    client.release();
  }
}

(async () => {
  await runSchemaMigrations();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
