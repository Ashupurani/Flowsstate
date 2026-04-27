# Flowsstate - Productivity Hub

A comprehensive productivity application combining task management, habit tracking, goal setting, and team collaboration features.

## Features

- ✅ **Task Management** - Kanban board with priority and categories
- ✅ **Habit Tracking** - Daily habits with streak tracking
- ✅ **Goal Setting** - Long-term goals with progress tracking
- ✅ **Pomodoro Timer** - Focus sessions with time tracking
- ✅ **Focus Blocks** - Distraction-free work sessions
- ✅ **Analytics** - Insights into productivity patterns
- ✅ **Team Collaboration** - Share tasks and goals with team
- ✅ **Data Export** - Export data as JSON, CSV, or Excel
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **PWA Support** - Install as app or use in browser

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/flowsstate.git
cd flowsstate/client/public/productivity-hub
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Install dependencies**
```bash
npm install
```

4. **Set up database**
```bash
# Create database and run migrations
psql -U postgres -d flowsstate < migrations/0000_init_base_tables.sql
psql -U postgres -d flowsstate < migrations/0002_add_habit_entries_foreign_key.sql
psql -U postgres -d flowsstate < migrations/0003_add_user_id_to_task_time_entries.sql
psql -U postgres -d flowsstate < migrations/0004_fix_enhanced_tasks_schema.sql
psql -U postgres -d flowsstate < migrations/0005_add_unique_active_focus_constraint.sql
```

5. **Start development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` for all required and optional environment variables.

### Critical Variables
- `JWT_SECRET` - Required. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Email service API key
- `FRONTEND_URL` - Frontend URL for redirects

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with token
- `GET /api/auth/user` - Get current user

### Tasks
- `GET /api/tasks?limit=20&offset=0` - List tasks (paginated)
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Habits
- `GET /api/habits?limit=20&offset=0` - List habits (paginated)
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habit-entries/toggle` - Toggle habit completion

### Goals
- `GET /api/goals?limit=20&offset=0` - List goals (paginated)
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Focus Blocks
- `POST /api/focus-blocks/start` - Start focus session
- `PUT /api/focus-blocks/:id/pause` - Pause session
- `PUT /api/focus-blocks/:id/resume` - Resume session
- `PUT /api/focus-blocks/:id/complete` - Complete session

### Data
- `GET /api/export/data` - Export data as JSON
- `GET /api/export/excel` - Export data as Excel
- `GET /api/export/zip` - Export data as ZIP

## Database Schema

### Core Tables
- `users` - User accounts and authentication
- `tasks` - Task management
- `habits` - Habit definitions and tracking
- `habit_entries` - Daily habit completion records
- `goals` - Goal setting and tracking
- `pomodoro_sessions` - Time tracking sessions
- `focus_blocks` - Distraction-free work sessions
- `focus_interruptions` - Interruption tracking
- `teams` - Team management
- `team_members` - Team membership and roles
- `team_invitations` - Team invitations

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run check
```

### Building
```bash
npm run build
```

### Database Migrations
New migrations should be placed in the `migrations/` directory with sequential numbering (0006_, 0007_, etc.).

## Security

### Implemented Features
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting (100 req/15 min per IP, 5 req/15 min for auth)
- ✅ Input validation with Zod
- ✅ Foreign key constraints for data integrity
- ✅ User isolation (multi-tenancy)
- ✅ CORS configuration
- ✅ Request size limits (10KB)

### Security Best Practices
1. Always set `JWT_SECRET` - no fallback in production
2. Use HTTPS in production
3. Keep dependencies updated
4. Monitor rate limiting
5. Regular security audits

## Performance Optimizations

### Implemented
- ✅ Pagination for list endpoints
- ✅ Database indexes on frequently queried columns
- ✅ Request size limits
- ✅ Rate limiting to prevent abuse

### Future
- Database query optimization
- Redis caching layer
- CDN for static assets
- Bundle size optimization

## Deployment

### Heroku
```bash
git push heroku main
heroku run "npm run migrate"
```

### Docker
```bash
docker build -t flowsstate .
docker run -p 3001:3001 --env-file .env flowsstate
```

### Replit
The project is configured to run on Replit with automatic environment detection.

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test
3. Commit: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

## Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] AI-powered insights and recommendations
- [ ] Calendar integration
- [ ] Slack integration
- [ ] Advanced analytics and reporting
- [ ] Dark mode
- [ ] Multi-language support
- [ ] WebSocket real-time updates

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Check credentials

### JWT Errors
- Verify `JWT_SECRET` is set
- Check token hasn't expired
- Ensure token format is correct (Bearer token)

### Build Failures
- Run `npm install` to ensure dependencies
- Check TypeScript errors with `npm run check`
- Clear node_modules: `rm -rf node_modules && npm install`

## License

ISC

## Support

For issues and questions, please open a GitHub issue.

---

**Last Updated:** April 27, 2026
**Status:** Production Ready with Comprehensive Fixes
