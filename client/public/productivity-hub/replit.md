# Productivity Hub - Full-Stack Application

## Overview

This is a full-stack productivity application built with React frontend and Express backend, designed to help users manage tasks, habits, and pomodoro sessions. The application features a modern UI built with shadcn/ui components and Tailwind CSS, with PostgreSQL as the database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Layout management: Added collapsible sidebars for better space management and horizontal scrolling support.
UX Improvements: Focus on functional parameters over showcase elements, clear navigation paths, and proper data export formatting.

**CRITICAL: Data Reliability Requirements:**
- NEVER run database migrations or schema changes without explicit user approval
- Always backup existing data before any database operations
- Implement automatic data export functionality for user safety
- Any data loss is completely unacceptable and requires immediate rollback procedures
- User expressed strong concern about data reliability after experiencing data loss during schema updates

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for local state (Pomodoro timer, calendar)
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and building

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Style**: RESTful API with JSON responses
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Storage**: connect-pg-simple for PostgreSQL session storage
- **Development**: Hot reload with Vite integration in development

### Database Schema
The application uses four main entities:
- **Tasks**: Daily tasks organized by day of week with categories, priorities, and statuses
- **Habits**: Trackable habits with icons and colors
- **Habit Entries**: Daily completion records for habits
- **Pomodoro Sessions**: Time tracking records for focus sessions and breaks

## Key Components

### Task Management
- **Enhanced Task Board**: Kanban-style board with columns for "Proposed", "In Task", "Hurdles", and "Completed"
- **Weekly Organization**: Tasks are organized by days of the week
- **Categories**: Support for different task categories (Finance, HR, Dev, Content, Sales, Meeting, Communication)
- **Priority Levels**: High, medium, and low priority tasks
- **Drag & Drop**: Task status updates via drag and drop interface
- **Enhanced Task Modal**: Comprehensive task creation with subtasks, time tracking, and template support
- **Time Tracking**: Estimated vs actual time recording for improved planning
- **Smart Task Persistence**: Completed tasks remain in their original week for accurate historical tracking
- **Intelligent Carry Forward**: Only incomplete tasks (proposed, in-progress, hurdles) carry forward to new weeks

### Habit Tracking
- **Enhanced Habit Sidebar**: Left sidebar with comprehensive habit management
- **Visual Indicators**: Color-coded habits with custom icons and category filtering
- **Weekly View**: 7-day completion tracking with visual progress indicators
- **Analytics**: Habit performance metrics including streaks and completion rates
- **Custom Schedules**: Daily, weekdays, weekends, or custom scheduling options
- **Persistence**: Habit completion data stored in database

### Pomodoro Timer
- **Timer Widget**: Embedded in header for easy access
- **Session Types**: Focus (25min), short break (5min), long break (15min)
- **Auto-progression**: Automatic transitions between work and break sessions
- **Session Tracking**: All completed sessions stored in database

### Calendar Integration
- **Calendar Sidebar**: Right sidebar showing monthly view
- **Activity Indicators**: Visual indicators for days with tasks, habits, or pomodoro sessions
- **Date Selection**: Click to select and focus on specific dates

### AI-Powered Insights
- **Smart Analytics**: AI-driven productivity analysis and recommendations
- **Task Categorization**: Automatic task categorization using OpenAI
- **Productivity Patterns**: Intelligent insights into work patterns and optimization
- **Goal Suggestions**: AI-generated productivity goals based on user behavior

### Team Collaboration ✅ IMPLEMENTED
- **Automatic Team Creation**: Users get personal teams created automatically on first access
- **Team Member Management**: Full CRUD operations with role-based access (owner, admin, member, viewer)
- **Member Display**: Shows current team members with names, emails, roles, and join dates
- **Invitation System**: Email-based team member invitations with expiration (7 days)
- **Database Tables**: teams, team_members, team_invitations with proper relationships
- **Secure API Endpoints**: JWT-authenticated /api/team/members, /api/team/invitations, /api/team/invite
- **Frontend Integration**: Complete UI with invitation dialog, member list, and role management

### Smart Notifications
- **Intelligent Reminders**: Context-aware notifications based on user patterns
- **Deadline Alerts**: Proactive task deadline and priority notifications
- **Habit Reminders**: Smart daily habit completion reminders
- **Achievement Notifications**: Streak milestones and goal completion alerts
- **Break Reminders**: Pomodoro-based rest and focus session suggestions

### Goal Setting & Tracking
- **Comprehensive Goals**: SMART goal creation with categories and deadlines
- **Progress Tracking**: Visual progress indicators with target vs actual metrics
- **Milestone Management**: Breakdown of goals into achievable milestones
- **Analytics Integration**: Goal performance analytics and achievement insights

### Layout Management
- **Collapsible Sidebars**: Both left (habits) and right (calendar) sidebars can be collapsed
- **Header Toggle Controls**: Panel controls in header for easy sidebar management
- **Horizontal Scrolling**: Task board supports horizontal scrolling when sidebars are expanded
- **Responsive Design**: Layout adapts automatically to available space
- **Persistent State**: Sidebar collapse states are saved to localStorage
- **Mobile Bottom Navigation**: Fixed bottom navigation for mobile devices only (hidden on desktop)

### Progressive Web App (PWA)
- **Mobile Optimization**: Native app-like experience on mobile devices
- **Offline Capabilities**: Core functionality available without internet connection
- **Install Prompts**: Smart installation suggestions with benefits highlighting
- **Push Notifications**: Browser-based productivity reminders and updates
- **App Shortcuts**: Quick actions for adding tasks and starting timers

### Achievement System
- **Comprehensive Achievements**: Multi-category achievement tracking (tasks, habits, streaks, focus)
- **Progress Tracking**: Real-time progress indicators for each achievement
- **Rarity System**: Common to legendary achievement classifications
- **Points System**: Gamified scoring system with achievement points
- **Visual Gallery**: Interactive achievement gallery with unlock status

### Data Management
- **Export Functionality**: Professional Word document export replacing JSON for user-friendly data reporting
- **Date Range Filtering**: Flexible data export with time-based filtering
- **Backup Capabilities**: Complete productivity data backup and portability with CSV support
- **Analytics Integration**: Export includes productivity metrics and insights

### Calendar-Driven Navigation
- **Date Selection**: Calendar drives dashboard day/date selection for viewing future tasks
- **Future Task Management**: Ability to create and manage tasks for future dates
- **Date Context Display**: Header shows selected calendar date for clear navigation context
- **Cross-Component Integration**: Calendar selection updates entire dashboard view

### Email Team Invitations
- **Professional Invitations**: Standard email templates with inviter name and role details
- **Role-Based Access**: Viewer, member, and admin role assignments
- **Comprehensive Templates**: Full email content explaining platform benefits and onboarding
- **Team Management**: Complete team member management with role indicators

### Authentication System
- **Complete User Authentication**: Registration, login, and JWT-based session management
- **Development Mode**: Auto-verification enabled for development environment
- **Email Integration**: SendGrid integration for production email verification
- **Secure Token Storage**: JWT tokens with user claims and automatic session persistence

## Data Flow

### Client-Server Communication
1. **React Query**: Manages all server state with automatic caching and synchronization
2. **RESTful APIs**: Standard HTTP methods (GET, POST, PUT, DELETE) for CRUD operations
3. **Real-time Updates**: Optimistic updates with automatic retry on failure
4. **Error Handling**: Centralized error handling with user-friendly toast notifications

### State Management Strategy
- **Server State**: TanStack Query for API data (tasks, habits, sessions)
- **Client State**: Zustand stores for UI state (pomodoro timer, calendar navigation)
- **Persistent State**: Pomodoro timer state persisted to localStorage
- **Form State**: React Hook Form with Zod validation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **zustand**: State management
- **zod**: Schema validation
- **openai**: AI-powered insights and task categorization

### UI Dependencies
- **@radix-ui/***: Headless UI components (30+ components)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with Express API proxy
- **Type Checking**: TypeScript compilation without emit
- **Database**: Drizzle Kit for schema migrations and management

### Production Build
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles Express server to `dist/index.js`
3. **Assets**: Static files served from Express in production
4. **Database**: PostgreSQL with connection pooling via @neondatabase/serverless

### Environment Configuration
- **DATABASE_URL**: Required environment variable for PostgreSQL connection
- **NODE_ENV**: Controls development vs production behavior
- **Session Storage**: PostgreSQL-backed sessions for scalability

### Replit Integration
- **Cartographer**: Development-only plugin for Replit environment
- **Runtime Error Modal**: Enhanced error display in development
- **Banner Script**: Replit development environment indicator

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and optimized for both development experience and production performance.