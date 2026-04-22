--
-- PostgreSQL database dump
--

\restrict fd4dgr1imfEj6wLiNEteN1q5wZVNfPGogW7Rqo9u7LMQupn0Cu6xCvL5bogPeIi

-- Dumped from database version 16.12 (8dbf2dd)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: enhanced_tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.enhanced_tasks (
    id integer NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'proposed'::text NOT NULL,
    day_of_week text NOT NULL,
    notes text,
    estimated_time integer,
    actual_time integer,
    subtasks text[],
    dependencies integer[],
    is_template boolean DEFAULT false,
    template_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.enhanced_tasks OWNER TO neondb_owner;

--
-- Name: enhanced_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.enhanced_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enhanced_tasks_id_seq OWNER TO neondb_owner;

--
-- Name: enhanced_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.enhanced_tasks_id_seq OWNED BY public.enhanced_tasks.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    target_value integer NOT NULL,
    current_value integer DEFAULT 0,
    unit text NOT NULL,
    deadline text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_id integer NOT NULL
);


ALTER TABLE public.goals OWNER TO neondb_owner;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals_id_seq OWNER TO neondb_owner;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: habit_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.habit_entries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    habit_id integer NOT NULL,
    date text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.habit_entries OWNER TO neondb_owner;

--
-- Name: habit_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.habit_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habit_entries_id_seq OWNER TO neondb_owner;

--
-- Name: habit_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.habit_entries_id_seq OWNED BY public.habit_entries.id;


--
-- Name: habits; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.habits (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    color text NOT NULL,
    streak_goal integer DEFAULT 7 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    category text
);


ALTER TABLE public.habits OWNER TO neondb_owner;

--
-- Name: habits_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.habits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habits_id_seq OWNER TO neondb_owner;

--
-- Name: habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.habits_id_seq OWNED BY public.habits.id;


--
-- Name: milestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.milestones (
    id integer NOT NULL,
    goal_id integer,
    title text NOT NULL,
    target_value integer NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone
);


ALTER TABLE public.milestones OWNER TO neondb_owner;

--
-- Name: milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.milestones_id_seq OWNER TO neondb_owner;

--
-- Name: milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.milestones_id_seq OWNED BY public.milestones.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    read boolean DEFAULT false,
    scheduled_for timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    user_id integer NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pomodoro_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pomodoro_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    duration integer NOT NULL,
    type text DEFAULT 'focus'::text NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pomodoro_sessions OWNER TO neondb_owner;

--
-- Name: pomodoro_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pomodoro_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pomodoro_sessions_id_seq OWNER TO neondb_owner;

--
-- Name: pomodoro_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pomodoro_sessions_id_seq OWNED BY public.pomodoro_sessions.id;


--
-- Name: task_time_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_time_entries (
    id integer NOT NULL,
    task_id integer,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    duration integer,
    description text
);


ALTER TABLE public.task_time_entries OWNER TO neondb_owner;

--
-- Name: task_time_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_time_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_time_entries_id_seq OWNER TO neondb_owner;

--
-- Name: task_time_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_time_entries_id_seq OWNED BY public.task_time_entries.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'proposed'::text NOT NULL,
    day_of_week text NOT NULL,
    week_key text NOT NULL,
    original_week text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tasks OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: team_invitations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.team_invitations (
    id integer NOT NULL,
    team_id integer NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    invited_by integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.team_invitations OWNER TO neondb_owner;

--
-- Name: team_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.team_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_invitations_id_seq OWNER TO neondb_owner;

--
-- Name: team_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.team_invitations_id_seq OWNED BY public.team_invitations.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    team_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL,
    last_active timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.team_members OWNER TO neondb_owner;

--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_members_id_seq OWNER TO neondb_owner;

--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    owner_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teams OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    password text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: enhanced_tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enhanced_tasks ALTER COLUMN id SET DEFAULT nextval('public.enhanced_tasks_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: habit_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.habit_entries ALTER COLUMN id SET DEFAULT nextval('public.habit_entries_id_seq'::regclass);


--
-- Name: habits id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.habits ALTER COLUMN id SET DEFAULT nextval('public.habits_id_seq'::regclass);


--
-- Name: milestones id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.milestones ALTER COLUMN id SET DEFAULT nextval('public.milestones_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pomodoro_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pomodoro_sessions ALTER COLUMN id SET DEFAULT nextval('public.pomodoro_sessions_id_seq'::regclass);


--
-- Name: task_time_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_time_entries ALTER COLUMN id SET DEFAULT nextval('public.task_time_entries_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: team_invitations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_invitations ALTER COLUMN id SET DEFAULT nextval('public.team_invitations_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: enhanced_tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.enhanced_tasks (id, title, category, priority, status, day_of_week, notes, estimated_time, actual_time, subtasks, dependencies, is_template, template_id, created_at) FROM stdin;
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goals (id, title, description, category, target_value, current_value, unit, deadline, priority, status, created_at, user_id) FROM stdin;
3	Read 12 books this year	Sharpen your mind and live fully	Learning	12	0	Books	2027-03-02	medium	active	2026-03-02 18:58:06.288325	3
4	Read 12 Books	\N	Work	12	1	books	2026-06-01	medium	active	2026-03-23 15:16:49.564519	13
\.


--
-- Data for Name: habit_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.habit_entries (id, user_id, habit_id, date, completed, created_at) FROM stdin;
103	3	11	2026-01-12	t	2026-01-13 13:06:56.233471
2	3	11	2025-08-06	t	2025-08-07 01:15:34.024913
3	3	12	2025-08-05	t	2025-08-07 01:15:49.923458
4	3	12	2025-08-06	t	2025-08-07 01:15:50.476709
5	3	12	2025-08-04	t	2025-08-07 01:15:54.566334
6	3	13	2025-08-04	t	2025-08-07 01:16:14.860939
7	3	11	2025-08-05	t	2025-08-07 02:21:45.969763
8	3	12	2025-08-07	t	2025-08-07 17:29:14.873581
9	3	12	2025-08-08	t	2025-08-08 19:25:53.342322
10	3	13	2025-08-07	t	2025-08-08 19:26:03.553737
1	3	11	2025-08-07	t	2025-08-07 01:15:31.800492
104	3	11	2026-01-13	t	2026-01-13 20:52:18.164923
105	3	11	2026-01-14	t	2026-01-15 15:32:03.189844
106	3	11	2026-01-15	t	2026-01-16 16:26:11.519283
13	6	16	2025-08-15	f	2025-08-10 22:39:32.324012
107	3	11	2026-01-19	t	2026-01-20 17:43:27.062219
15	6	16	2025-08-13	f	2025-08-10 22:39:53.413667
16	6	16	2025-08-12	f	2025-08-10 22:39:54.590269
108	3	20	2026-01-19	t	2026-01-20 17:43:31.15324
109	3	13	2026-01-19	t	2026-01-20 17:43:38.13948
110	3	11	2026-01-29	t	2026-01-30 15:36:28.636509
111	3	11	2026-01-28	t	2026-01-30 15:36:28.918447
112	3	12	2026-01-29	t	2026-01-30 15:36:32.473553
113	3	17	2026-01-29	t	2026-01-30 15:36:37.997969
14	6	16	2025-08-16	f	2025-08-10 22:39:48.332232
12	6	16	2025-08-14	f	2025-08-10 22:39:30.362374
11	6	16	2025-08-11	f	2025-08-10 22:37:06.197577
17	3	12	2025-08-12	t	2025-08-12 17:53:16.616572
18	3	11	2025-08-12	t	2025-08-12 18:40:12.833211
19	3	17	2025-08-12	t	2025-08-13 00:06:36.597979
20	3	13	2025-08-12	t	2025-08-13 03:34:00.4049
21	3	17	2025-08-14	f	2025-08-15 14:16:35.367761
22	3	12	2025-08-14	t	2025-08-15 14:16:38.609165
23	3	11	2025-08-14	t	2025-08-15 14:16:40.862546
24	3	13	2025-08-14	t	2025-08-15 14:16:44.500651
25	3	13	2025-08-13	t	2025-08-15 14:16:49.42189
26	3	11	2025-08-13	t	2025-08-15 14:16:53.268927
27	3	12	2025-08-13	t	2025-08-15 14:16:54.191148
28	3	12	2025-08-21	t	2025-08-22 01:44:29.749646
29	3	11	2025-08-21	t	2025-08-22 16:51:14.441183
30	3	11	2025-08-23	t	2025-08-24 02:04:00.829293
31	3	13	2025-08-23	t	2025-08-24 02:04:02.782029
32	3	14	2025-08-23	t	2025-08-24 21:08:40.707863
33	3	14	2025-08-24	t	2025-08-24 21:08:42.577925
34	3	17	2025-08-24	t	2025-08-25 12:26:38.421251
35	3	11	2025-08-24	t	2025-08-25 12:26:39.649683
36	3	12	2025-08-24	t	2025-08-25 12:26:42.764626
37	3	11	2025-08-25	t	2025-08-26 01:13:38.321752
38	3	17	2025-08-26	t	2025-08-27 17:52:19.427188
39	3	13	2025-09-01	t	2025-09-02 16:59:14.348504
40	3	11	2025-09-01	t	2025-09-02 16:59:17.553085
41	3	13	2025-09-02	t	2025-09-03 18:56:00.587903
42	3	14	2025-09-02	t	2025-09-03 18:56:05.44265
43	3	11	2025-09-02	t	2025-09-03 18:56:08.295116
44	3	12	2025-09-03	t	2025-09-04 16:34:45.753797
45	3	11	2025-09-03	t	2025-09-04 16:34:52.282043
46	3	13	2025-09-10	t	2025-09-11 00:01:07.266736
47	3	11	2025-09-10	t	2025-09-11 00:01:10.950714
48	3	11	2025-09-11	t	2025-09-11 00:01:15.311452
49	3	17	2025-09-18	t	2025-09-19 17:55:32.980599
50	3	11	2025-09-18	t	2025-09-19 17:55:34.788712
51	3	12	2025-09-18	t	2025-09-19 18:00:44.060705
52	3	13	2025-09-25	t	2025-09-26 14:33:59.985566
53	3	11	2025-09-25	t	2025-09-26 14:34:02.077049
54	3	17	2025-09-25	t	2025-09-26 14:34:03.167102
55	3	12	2025-09-25	t	2025-09-26 14:34:05.090571
56	3	14	2025-09-25	t	2025-09-26 14:34:06.39519
57	3	13	2025-10-16	t	2025-10-17 14:29:44.378458
58	3	14	2025-10-16	t	2025-10-17 14:29:46.888736
59	3	17	2025-10-16	t	2025-10-17 14:29:48.173851
60	3	11	2025-10-16	t	2025-10-17 14:29:49.691472
61	3	12	2025-10-15	t	2025-10-17 14:29:52.489572
62	3	11	2025-10-24	t	2025-10-25 04:09:10.430559
63	3	11	2025-10-25	t	2025-10-25 04:09:12.654629
66	3	14	2025-10-23	t	2025-10-25 04:09:23.132556
65	3	14	2025-10-24	f	2025-10-25 04:09:17.933842
67	3	11	2025-10-23	t	2025-10-25 04:09:26.279487
68	3	12	2025-10-23	t	2025-10-25 04:09:27.736698
64	3	12	2025-10-24	f	2025-10-25 04:09:13.447117
69	3	13	2025-11-11	t	2025-11-13 05:29:26.932273
70	3	17	2025-11-11	t	2025-11-13 05:29:35.388795
71	3	11	2025-11-11	t	2025-11-13 05:29:36.499222
72	3	11	2025-11-12	t	2025-11-13 05:29:37.068025
73	3	12	2025-11-10	t	2025-11-13 05:29:41.141251
74	3	11	2025-11-13	t	2025-11-14 05:51:29.808934
75	3	14	2025-11-13	t	2025-11-14 05:51:33.252208
76	3	20	2025-11-17	t	2025-11-18 14:22:33.169466
77	3	11	2025-11-17	t	2025-11-18 14:22:37.925364
78	3	11	2025-11-18	t	2025-11-20 03:47:59.565967
79	3	11	2025-11-19	t	2025-11-20 03:48:01.997467
80	3	20	2025-11-24	t	2025-11-24 20:17:46.444966
81	3	11	2025-11-24	t	2025-11-24 20:17:48.603083
82	3	11	2025-11-25	t	2025-11-25 19:49:16.141326
83	3	20	2025-12-04	t	2025-12-05 16:19:03.837472
84	3	14	2025-12-15	t	2025-12-16 19:52:30.781625
85	3	20	2025-12-16	t	2025-12-16 19:52:37.232382
86	3	20	2025-12-15	t	2025-12-16 19:52:39.532181
87	3	12	2025-12-16	t	2025-12-17 14:54:58.768896
88	3	11	2025-12-16	t	2025-12-17 14:55:00.180169
89	3	13	2025-12-16	t	2025-12-17 14:55:03.847919
90	3	12	2025-12-23	t	2025-12-23 03:11:44.312082
91	3	11	2025-12-29	t	2025-12-31 16:44:49.007891
92	3	14	2025-12-29	t	2025-12-31 16:44:52.420756
93	3	14	2026-01-04	t	2026-01-05 02:11:49.872763
94	3	12	2026-01-04	t	2026-01-05 02:11:51.442984
95	3	12	2026-01-05	t	2026-01-07 17:30:31.407799
96	3	20	2026-01-05	t	2026-01-07 17:30:35.183214
97	3	11	2026-01-05	t	2026-01-07 17:30:40.198128
98	3	11	2026-01-06	t	2026-01-07 17:30:40.726541
99	3	17	2026-01-05	t	2026-01-07 17:30:45.350226
100	3	13	2026-01-05	t	2026-01-07 17:30:49.542172
101	3	11	2026-01-09	t	2026-01-09 02:29:58.549586
102	3	11	2026-01-08	t	2026-01-09 02:30:00.207066
114	3	20	2026-01-30	t	2026-01-30 20:58:42.539701
115	3	11	2026-02-02	t	2026-02-02 15:37:25.9269
116	3	11	2026-02-03	t	2026-02-04 20:36:08.858201
117	3	14	2026-02-11	t	2026-02-11 19:00:37.839765
118	3	11	2026-02-10	t	2026-02-11 19:00:47.612056
119	3	11	2026-02-09	t	2026-02-11 19:00:48.727546
120	3	20	2026-02-09	t	2026-02-11 19:00:53.39345
121	3	13	2026-02-09	t	2026-02-11 19:01:01.046437
122	3	11	2026-02-13	t	2026-02-14 06:26:49.189131
123	3	14	2026-02-13	f	2026-02-14 06:26:55.418146
124	3	11	2026-02-19	t	2026-02-20 17:11:58.339479
125	3	11	2026-02-18	t	2026-02-20 17:11:59.526485
126	3	12	2026-02-19	t	2026-02-20 17:12:02.141263
127	3	12	2026-02-18	t	2026-02-20 17:12:03.154291
128	3	17	2026-02-18	t	2026-02-20 17:12:12.146891
129	3	11	2026-02-23	t	2026-02-24 13:10:27.371977
130	3	12	2026-02-23	t	2026-02-24 13:10:28.414206
131	3	12	2026-02-22	f	2026-02-24 13:10:36.827448
132	3	11	2026-03-01	t	2026-03-02 13:38:15.255085
133	3	13	2026-03-01	t	2026-03-02 13:38:19.287293
134	3	17	2026-03-01	t	2026-03-02 13:38:23.807237
135	23	25	2026-02-02	t	2026-03-02 16:38:15.181204
136	23	25	2026-02-03	t	2026-03-02 16:38:15.733944
137	23	25	2026-02-04	t	2026-03-02 16:38:16.211424
138	23	25	2026-02-05	t	2026-03-02 16:38:16.693525
139	23	22	2026-02-02	t	2026-03-02 16:38:17.617173
140	23	22	2026-02-03	t	2026-03-02 16:38:18.234745
141	23	22	2026-02-04	f	2026-03-02 16:38:18.951403
142	23	22	2026-02-05	f	2026-03-02 16:38:19.332256
143	23	22	2026-02-06	f	2026-03-02 16:38:22.122372
144	3	12	2026-03-02	t	2026-03-03 16:58:01.299383
145	3	13	2026-03-02	t	2026-03-03 16:58:03.1285
146	3	13	2026-03-03	t	2026-03-03 16:58:03.7903
147	3	20	2026-03-02	t	2026-03-03 16:58:05.809175
148	3	11	2026-03-09	t	2026-03-10 19:03:44.048497
149	3	14	2026-03-09	t	2026-03-10 19:03:48.739629
150	3	11	2026-03-19	t	2026-03-20 16:57:53.696993
151	3	14	2026-03-23	t	2026-03-23 14:59:32.003033
152	3	17	2026-03-25	t	2026-03-26 16:58:24.5672
153	3	12	2026-03-25	t	2026-03-26 16:58:27.10789
154	3	12	2026-03-26	t	2026-03-27 15:59:31.495157
155	3	17	2026-03-31	t	2026-04-01 13:55:59.767369
156	3	11	2026-03-31	t	2026-04-01 13:56:01.343407
157	3	12	2026-03-31	t	2026-04-01 13:56:03.318654
158	3	11	2026-04-01	t	2026-04-02 14:04:29.674464
159	3	12	2026-04-01	t	2026-04-02 14:04:32.251743
160	3	13	2026-04-01	t	2026-04-02 14:04:33.662841
161	3	17	2026-04-06	t	2026-04-07 15:54:33.930295
162	3	11	2026-04-06	t	2026-04-07 15:54:35.523396
163	3	14	2026-04-08	t	2026-04-09 16:49:34.263917
164	3	13	2026-04-08	t	2026-04-09 16:49:35.345909
165	3	11	2026-04-08	t	2026-04-09 16:49:41.404389
166	3	13	2026-04-10	t	2026-04-10 14:08:46.441131
167	3	13	2026-04-12	t	2026-04-13 12:38:21.549899
168	3	14	2026-04-12	t	2026-04-13 12:38:29.608643
169	3	11	2026-04-11	t	2026-04-13 12:38:31.155832
170	3	11	2026-04-12	t	2026-04-13 12:38:31.644119
171	3	13	2026-04-13	t	2026-04-13 12:38:41.562023
172	3	20	2026-04-13	t	2026-04-14 14:15:33.063057
173	3	11	2026-04-13	t	2026-04-14 14:15:35.895718
174	3	12	2026-04-14	t	2026-04-15 19:23:29.854404
175	3	12	2026-04-15	t	2026-04-16 19:49:51.500092
176	3	13	2026-04-15	t	2026-04-16 19:49:52.812113
177	3	11	2026-04-15	t	2026-04-16 19:49:57.225906
178	3	17	2026-04-15	t	2026-04-16 19:50:00.458388
\.


--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.habits (id, user_id, name, icon, color, streak_goal, created_at, category) FROM stdin;
7	1	Drink Water	fas fa-tint	blue-500	7	2025-08-07 00:16:53.648547	\N
8	1	Workout	fas fa-dumbbell	green-500	7	2025-08-07 00:16:53.712737	\N
9	1	Read	fas fa-book	purple-500	7	2025-08-07 00:16:53.781906	\N
10	1	Meditate	fas fa-leaf	green-600	7	2025-08-07 00:16:54.307136	\N
15	5	Drink 4L water	fas fa-check	blue-500	7	2025-08-07 15:42:50.347523	\N
21	16	Start Server	fas fa-check	blue-500	7	2025-12-08 01:24:57.74909	\N
24	2	Read Book	fas fa-book	blue-500	7	2026-03-02 16:17:23.188047	Learning
25	23	AFSFds	fas fa-check	blue-500	7	2026-03-02 16:36:44.771527	MLF
23	2	Morning Run	fas fa-running	blue-500	7	2026-03-02 16:16:50.653608	Wellness
22	23	Drink water	fas fa-check	blue-500	7	2026-01-30 14:56:21.218091	General
17	3	Write	fas fa-check	blue-500	7	2025-08-12 19:04:01.148412	Personal
11	3	Drink 4L Water	fas fa-check	blue-500	7	2025-08-07 01:15:28.336507	Personal
14	3	Read	fas fa-check	blue-500	7	2025-08-07 01:16:36.535799	Personal
12	3	Workout	fas fa-check	blue-500	7	2025-08-07 01:15:47.90165	Personal
13	3	Meditation	fas fa-check	blue-500	7	2025-08-07 01:16:13.163303	Personal
20	3	Study 30 Min	fas fa-check	blue-500	7	2025-11-17 18:07:46.029937	MLF
26	27	Start Dev2c	fas fa-check	blue-500	7	2026-03-02 17:33:59.342608	MLF
18	13	Check Zendesk Tickets	fas fa-check	blue-500	7	2025-10-06 14:47:18.243744	MLF
27	13	Study for DP-700	fas fa-check	blue-500	7	2026-03-23 15:11:14.699438	MLF
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.milestones (id, goal_id, title, target_value, completed, completed_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, type, title, message, priority, read, scheduled_for, created_at, user_id) FROM stdin;
\.


--
-- Data for Name: pomodoro_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pomodoro_sessions (id, user_id, duration, type, completed_at) FROM stdin;
1	3	1500	focus	2025-12-19 18:37:40.791648
2	3	1500	focus	2026-01-02 18:41:08.539609
3	3	1500	focus	2026-01-05 18:15:34.488039
4	3	1500	focus	2026-01-20 02:53:41.461752
5	3	1500	focus	2026-01-30 18:07:38.531616
6	3	1500	focus	2026-02-09 16:23:38.290127
7	3	1500	focus	2026-03-23 16:03:19.379926
\.


--
-- Data for Name: task_time_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_time_entries (id, task_id, start_time, end_time, duration, description) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, user_id, title, category, priority, status, day_of_week, week_key, original_week, notes, created_at) FROM stdin;
24	3	Call Manthan	Personal	medium	completed	thursday	2025-07-14	2025-07-14		2025-08-12 17:47:15.684783
28	3	Book return	Personal	medium	completed	tuesday	2025-08-11	2025-08-11		2025-08-19 15:15:20.582158
11	3	Fold clothes	Personal	medium	completed	wednesday	2025-08-04	2025-08-04		2025-08-07 01:22:41.700237
38	3	UAT log	MLF	high	completed	monday	2025-08-25	2025-08-25		2025-09-08 12:05:22.78127
6	3	VAN List	MLF	medium	completed	wednesday	2025-08-04	2025-08-04		2025-08-07 01:20:46.033152
8	3	Medical Checkup	Personal	medium	completed	thursday	2025-08-04	2025-08-04		2025-08-07 01:21:34.815016
3	3	Make full routine	Personal	high	completed	wednesday	2025-08-04	2025-08-04		2025-08-07 01:19:44.74116
7	3	CData Flow & revise	MLF	medium	completed	thursday	2025-08-04	2025-08-04		2025-08-07 01:21:13.648694
9	3	Senen Walmart	MLF	medium	completed	thursday	2025-08-04	2025-08-04		2025-08-07 01:22:05.391459
20	6	Listening		medium	proposed	monday	2025-08-04	2025-08-04		2025-08-10 22:37:41.704632
39	3	LinkedIn learning	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-08 12:05:39.477961
40	3	EDI Techs	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-08 12:06:06.159695
21	6	Speaking		medium	in_task	monday	2025-08-04	2025-08-04		2025-08-10 22:37:58.579301
45	3	Meet HR	MLF	high	completed	monday	2025-08-25	2025-08-25		2025-09-16 17:38:41.776903
22	6	Insurance Money		high	hurdles	monday	2025-08-04	2025-08-04		2025-08-10 22:38:49.855113
2	3	Cancel Rogers	Personal	medium	completed	tuesday	2025-08-04	2025-08-04		2025-08-07 01:19:23.225151
10	3	Robert BR-SRV	MLF	medium	completed	thursday	2025-08-04	2025-08-04		2025-08-07 01:22:23.029226
33	3	Fetch list for customer account	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-08-25 12:28:05.966608
16	3	FInance	Personal	medium	completed	wednesday	2025-08-04	2025-08-04		2025-08-07 02:22:18.190321
14	3	Splitwise	Personal	medium	completed	wednesday	2025-08-04	2025-08-04		2025-08-07 01:24:57.257824
32	3	CData errors	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-08-25 12:27:19.063396
41	3	Doctor appointment	Personal	medium	completed	tuesday	2025-08-25	2025-08-25		2025-09-09 14:21:51.801937
25	3	Call Ankit	Personal	medium	completed	thursday	2025-07-14	2025-07-14		2025-08-12 17:47:29.972743
27	3	itrade check		medium	completed	thursday	2025-07-14	2025-07-14		2025-08-14 16:01:53.220575
35	3	Check 64062	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-08-25 12:30:26.09378
31	3	UAT Refresh	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-08-25 12:26:06.913561
37	3	Power BI	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-08-25 16:15:27.621383
34	3	VAN List		medium	completed	monday	2025-08-25	2025-08-25		2025-08-25 12:28:44.273855
53	3	CSCF-00003 : LOBLAWS INC	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-25 14:52:37.31102
43	3	NW Co	MLF	high	completed	monday	2025-08-25	2025-08-25		2025-09-15 12:47:39.043415
19	6	Reading		medium	in_task	wednesday	2025-08-04	2025-08-04		2025-08-10 22:37:25.943307
36	3	SIN update	Personal	medium	completed	tuesday	2025-08-25	2025-08-25		2025-08-25 14:44:41.161377
29	3	Call Bloodwork		medium	completed	monday	2025-08-11	2025-08-11		2025-08-21 23:18:19.231178
30	3	Goggles insurance	Personal	medium	completed	monday	2025-08-25	2025-08-25		2025-08-24 21:51:26.467263
26	3	PR Lawyer		medium	completed	thursday	2025-07-14	2025-07-14		2025-08-12 18:03:51.36863
54	3	Task time update	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-29 11:59:18.163217
46	3	GuardMe	Personal	medium	completed	monday	2025-08-25	2025-08-25		2025-09-16 18:47:02.130953
47	3	Gentran doc	MLF	high	completed	monday	2025-08-25	2025-08-25		2025-09-22 11:52:39.194021
12	3	Monika parcel	Personal	medium	completed	tuesday	2025-08-04	2025-08-04		2025-08-07 01:23:02.279503
5	3	VIdeo Chocolates	Personal	high	completed	monday	2026-01-19	2025-08-04		2025-08-07 01:20:24.058234
48	3	Prepare power BI	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-22 11:54:59.890551
69	3	Parents visa file	Personal	high	completed	friday	2025-12-29	2025-10-20		2025-10-30 00:03:54.893056
49	3	Check walmart	MLF	medium	completed	thursday	2025-08-25	2025-08-25		2025-09-25 14:08:10.675299
42	3	Driving licence call	Personal	medium	completed	wednesday	2025-08-25	2025-08-25		2025-09-15 12:47:17.351476
50	3	Check NGPROD 810	MLF	medium	completed	thursday	2025-08-25	2025-08-25		2025-09-25 14:08:23.074043
61	3	ADO Task create	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-10-06 14:43:54.136043
4	3	FLowsstate video	Personal	medium	proposed	tuesday	2026-04-20	2025-08-04		2025-08-07 01:20:01.676154
58	3	Tadas ref*dp	MLF	high	completed	tuesday	2025-08-25	2025-08-25		2025-09-30 16:12:16.90124
66	3	NGPROD REF*DP	MLF	medium	completed	monday	2025-10-06	2025-10-06		2025-10-06 16:53:35.276671
51	3	Check Errors	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-25 14:10:04.159252
65	3	Dev2c segments	MLF	medium	completed	monday	2025-10-06	2025-10-06		2025-10-06 15:30:17.962629
57	3	Take Access	MLF	medium	completed	tuesday	2025-08-25	2025-08-25		2025-09-30 15:15:17.243262
44	3	Learning	MLF	medium	completed	monday	2025-08-25	2025-08-25		2025-09-15 12:47:50.296826
68	3	856 compare	MLF	medium	completed	monday	2025-10-27	2025-10-27		2025-10-27 14:34:48.118248
52	3	Wiki Update	MLF	medium	completed	tuesday	2025-08-25	2025-08-25		2025-09-25 14:13:39.336593
55	3	Call Rogers	Personal	medium	completed	tuesday	2025-08-25	2025-08-25		2025-09-30 15:13:33.727479
15	3	5paisa	Personal	medium	completed	thursday	2025-08-04	2025-08-04		2025-08-07 02:20:50.231306
72	3	Check Errors	MLF	medium	completed	monday	2025-11-10	2025-11-10		2025-11-10 14:28:05.764352
71	3	Complete PBI	MLF	high	completed	monday	2025-11-10	2025-11-10		2025-11-10 14:27:41.919114
64	3	Learn  about data engg	MLF	medium	completed	thursday	2025-10-06	2025-10-06		2025-10-06 14:59:11.389809
75	17	Personal Task 1	Personal	medium	proposed	monday	2025-11-10	\N	\N	2025-11-13 05:11:19.908444
76	17	Work Task 1	Work	medium	in_task	tuesday	2025-11-10	\N	\N	2025-11-13 05:11:19.970542
77	17	Personal Task 2	Personal	medium	proposed	wednesday	2025-11-10	\N	\N	2025-11-13 05:11:20.025089
67	3	Learn Linkedin Premium	MLF	medium	completed	monday	2025-10-27	2025-10-27		2025-10-27 14:34:28.575069
70	3	Passport renew	Personal	medium	completed	thursday	2025-10-20	2025-10-20		2025-10-30 00:05:21.820408
80	19	Finance Report	Finance	medium	proposed	monday	2025-11-10	2025-11-10		2025-11-13 05:44:19.936153
81	19	HR Meeting	HR	medium	proposed	monday	2025-11-10	2025-11-10		2025-11-13 05:45:01.756997
82	19	Code Review	Dev	medium	proposed	monday	2025-11-10	2025-11-10		2025-11-13 05:45:42.062252
83	19	Content Writing	Content	medium	proposed	monday	2025-11-10	2025-11-10		2025-11-13 05:46:08.375875
94	3	Call Sitanshu	Personal	medium	completed	monday	2025-11-24	2025-11-24		2025-11-24 18:25:13.149153
124	24	Carry Test Task 8xMV	Dev	medium	proposed	monday	2025-12-15	2025-12-15		2025-12-16 17:29:06.448293
133	3	Read	Personal	medium	completed	monday	2026-01-05	2025-12-29		2026-01-04 20:24:28.347774
136	3	Reshape Goals	MLF	medium	completed	wednesday	2026-01-12	2026-01-05		2026-01-06 16:20:45.15762
106	3	Naveen meeting 05/12	MLF	medium	completed	friday	2025-12-01	2025-12-01	Agenda for tomorrow: Customer vendor link & EDI discount manually added or included in import?	2025-12-04 20:15:00.839642
90	3	Go through segments	MLF	medium	completed	tuesday	2025-11-17	2025-11-17		2025-11-17 13:57:42.383018
74	3	Leave Planning	MLF	medium	completed	monday	2025-11-10	2025-11-10		2025-11-12 19:26:10.824886
89	3	Coursera	MLF	medium	completed	monday	2025-11-17	2025-11-17		2025-11-17 13:29:44.933994
105	3	EDI Go live / Cut over tasks Tanya reminder 15th Dec	MLF	medium	completed	tuesday	2026-01-05	2025-12-01	need to remind tanya about having a meeting after playback. Product Backlog Item 72051: EDI Go live / Cut over tasks.\nAfter refresh, sales order which are oen needs to be recorded in order to be processed.	2025-12-04 20:09:07.535938
113	3	Alchemy	MLF	medium	completed	wednesday	2025-12-08	2025-12-08		2025-12-08 18:55:09.459495
86	3	Bug 79873	MLF	medium	completed	tuesday	2025-11-17	2025-11-17		2025-11-17 13:18:12.598757
93	3	Lucas Metz	MLF	high	completed	thursday	2025-11-17	2025-11-17		2025-11-20 18:42:49.846569
125	3	Splitwise	Personal	high	completed	tuesday	2025-12-22	2025-12-15		2025-12-16 19:58:27.185039
110	3	Review lines to delete	MLF	medium	completed	monday	2025-12-08	2025-12-08		2025-12-08 13:55:59.772337
88	3	Plan 856 for strategy	MLF	medium	completed	monday	2025-11-17	2025-11-17		2025-11-17 13:26:22.063674
95	3	Meeting notes	MLF	medium	completed	tuesday	2025-11-24	2025-11-24		2025-11-25 17:17:23.27289
97	3	Database refresh page add	MLF	medium	completed	thursday	2025-12-01	2025-12-01		2025-12-04 19:05:21.529351
92	3	810 Task complete	MLF	medium	completed	wednesday	2025-11-17	2025-11-17		2025-11-20 18:42:17.091631
96	3	Start 945	MLF	medium	completed	wednesday	2025-11-24	2025-11-24		2025-11-25 17:17:36.210802
87	3	UAT cutover plan review	MLF	medium	completed	wednesday	2025-11-17	2025-11-17		2025-11-17 13:18:29.6393
99	3	Customer vendot link	MLF	medium	completed	thursday	2025-12-01	2025-12-01		2025-12-04 19:05:40.091148
128	3	Goal Setting	MLF	high	completed	wednesday	2025-12-29	2025-12-29		2025-12-29 17:55:00.621633
127	3	Purolatoe	Personal	medium	completed	tuesday	2025-12-29	2025-12-22		2025-12-23 22:51:57.653516
134	3	Haircut	Personal	medium	completed	tuesday	2026-02-16	2025-12-29		2026-01-04 20:27:25.881074
111	3	Smoke test duties	MLF	medium	completed	monday	2025-12-08	2025-12-08		2025-12-08 13:56:33.743569
102	3	Print passport documents	Personal	medium	completed	thursday	2025-12-01	2025-12-01		2025-12-04 19:37:58.765684
117	3	Take CData in PowerBI	MLF	medium	completed	monday	2025-12-29	2025-12-22		2025-12-16 13:16:57.783504
118	22	Week 1 Task	Dev	medium	proposed	monday	2025-12-15	2025-12-15		2025-12-16 17:21:30.873423
126	3	Update SIN	Personal	high	completed	monday	2025-12-22	2025-12-22		2025-12-19 20:05:36.063799
135	3	Alchemy	MLF	medium	completed	monday	2026-01-05	2026-01-05		2026-01-05 16:25:45.909437
130	3	Go Gym	Personal	high	completed	sunday	2025-12-29	2025-12-29		2026-01-04 20:23:46.968159
131	3	Take Bath	Personal	high	completed	sunday	2025-12-29	2025-12-29		2026-01-04 20:24:07.812704
129	3	Porkopolis	MLF	medium	completed	monday	2026-01-05	2025-12-29		2025-12-30 15:56:21.601566
112	3	Research about PR	MLF	medium	completed	friday	2026-01-26	2025-12-08		2025-12-08 15:13:34.060691
154	3	Requirement for FO	MLF	high	completed	monday	2026-01-26	2026-01-19		2026-01-19 15:57:01.923589
138	3	Create Checklist for DEV	MLF	medium	completed	thursday	2026-01-05	2026-01-05		2026-01-07 17:29:29.068063
144	3	Complete flagged items	MLF	medium	completed	tuesday	2026-01-12	2026-01-12		2026-01-12 19:24:30.334719
132	3	Meditate	Personal	medium	completed	monday	2026-01-05	2025-12-29		2026-01-04 20:24:20.648793
137	3	Create points	MLF	high	completed	wednesday	2026-01-05	2026-01-05		2026-01-06 16:47:34.486533
139	3	Create ADO task for Gentran	MLF	medium	completed	thursday	2026-01-05	2026-01-05		2026-01-07 17:29:50.045986
98	3	810s	MLF	medium	completed	thursday	2026-01-05	2025-12-01		2025-12-04 19:05:28.268487
146	3	Book time with infra for EDI app	MLF	medium	completed	thursday	2026-01-12	2026-01-12		2026-01-13 13:51:03.649862
91	3	Dermatologists 	Personal	high	proposed	monday	2026-04-20	2025-11-17		2025-11-17 19:08:10.580512
142	3	ECA Documents	Personal	medium	completed	monday	2026-03-23	2026-01-05		2026-01-12 15:50:38.99835
145	3	Wiki update	MLF	medium	completed	tuesday	2026-01-26	2026-01-12		2026-01-12 19:25:36.803331
155	3	MetroItrade findout	MLF	medium	completed	monday	2026-02-02	2026-01-19		2026-01-20 17:44:10.430878
148	3	Finish Flagged Items	MLF	medium	completed	monday	2026-01-19	2026-01-19		2026-01-19 14:15:17.614184
156	3	Make Personal plan on handling load	MLF	high	completed	tuesday	2026-01-26	2026-01-19		2026-01-21 13:51:33.008271
149	3	Github Copilot	MLF	medium	completed	monday	2026-01-19	2026-01-19		2026-01-19 14:16:28.65839
153	3	Password Change	MLF	medium	completed	monday	2026-01-19	2026-01-19		2026-01-19 15:08:12.496739
143	3	Puma return	Personal	medium	completed	monday	2026-01-19	2026-01-12		2026-01-12 16:12:08.488878
114	3	EDI errors	MLF	medium	completed	friday	2026-02-09	2025-12-08		2025-12-10 23:46:17.672117
150	3	Complete testing 855 in Dev	MLF	high	completed	friday	2026-02-16	2026-01-19		2026-01-19 14:16:55.993615
151	3	Complete testing 856 in Dev	MLF	high	completed	wednesday	2026-01-19	2026-01-19		2026-01-19 14:17:09.942676
147	3	Create HLD for EDI Partners	MLF	medium	completed	monday	2026-01-26	2026-01-19	Create one document for each partner that includes transaction info which links to wiki and more info regarding the TPs	2026-01-15 20:08:30.305787
157	16	Complete Tasklist	Personal	medium	proposed	monday	2026-01-26	2026-01-26		2026-01-29 23:58:15.626049
158	16	Complete flagged items	Job	medium	proposed	thursday	2026-01-26	2026-01-19		2026-01-29 23:59:08.952733
152	3	Investigate Gentran	MLF	high	completed	tuesday	2026-02-09	2026-01-19		2026-01-19 14:18:55.407046
107	16	Check Emails	Job	medium	completed	monday	2026-01-26	2025-12-01		2025-12-08 01:24:39.366428
159	23	Complete flagged	MLF	medium	proposed	monday	2026-01-26	2025-12-15		2026-01-30 14:46:46.435012
160	23	Ashu	general	medium	completed	friday	2026-01-26	\N	\N	2026-01-30 15:14:18.76249
170	3	Requirement Shipdate	MLF	medium	completed	friday	2026-01-26	2026-01-26		2026-01-30 16:32:58.91215
181	3	Prepare list for meeting	MLF	medium	completed	tuesday	2026-02-23	2026-02-23		2026-02-24 15:45:30.944872
169	3	Update the Plan	MLF	high	completed	friday	2026-02-02	2026-01-26		2026-01-30 15:48:32.95821
168	3	Search about Itrade	MLF	high	completed	monday	2026-02-02	2026-01-26	with respect to iTrade how are we handling test connections from them...........would this be something they would need to set up with us? Do we need to reach out to them to organize	2026-01-30 15:48:12.925677
171	3	Prepare flow of EDI	MLF	medium	completed	monday	2026-02-02	2026-02-02		2026-02-02 13:23:57.520477
182	3	Complete 82502	MLF	medium	completed	wednesday	2026-02-23	2026-02-23		2026-02-24 16:27:41.876251
172	3	Complete all flagged items	MLF	medium	completed	monday	2026-02-09	2026-02-02		2026-02-02 15:37:00.156878
192	3	Complete 83232	MLF	medium	completed	monday	2026-03-09	2026-03-09		2026-03-09 12:17:47.527567
195	3	Update Excel	MLF	medium	completed	monday	2026-03-09	2026-03-09		2026-03-09 12:42:37.902656
183	3	Number of counts	MLF	medium	completed	monday	2026-03-09	2026-02-23		2026-02-25 18:26:25.675334
173	3	Find out CData config for OB	MLF	medium	completed	monday	2026-03-09	2026-02-02		2026-02-02 16:47:07.592876
179	3	Complete 82502 Argano	MLF	medium	completed	wednesday	2026-02-16	2026-02-16		2026-02-18 17:17:05.298487
178	3	Complete flagged items	MLF	medium	completed	wednesday	2026-02-16	2026-02-16		2026-02-18 17:14:53.163772
177	3	820 Reports	MLF	high	completed	wednesday	2026-02-16	2026-02-16		2026-02-18 17:14:26.753954
174	3	Dentist	Personal	medium	completed	wednesday	2026-02-16	2026-02-02		2026-02-02 19:39:52.322289
193	3	Start 82814	MLF	medium	completed	monday	2026-03-09	2026-03-09		2026-03-09 12:19:58.850891
185	3	Complete 855	MLF	medium	completed	tuesday	2026-03-09	2026-02-23		2026-02-27 14:50:39.797009
180	3	Draft Email	MLF	medium	completed	tuesday	2026-02-23	2026-02-23		2026-02-24 15:45:06.637991
186	3	Password change	MLF	medium	completed	monday	2026-03-02	2026-03-02		2026-03-02 14:19:49.5068
188	23	zgdgdxg		medium	proposed	monday	2026-02-02	2026-02-02		2026-03-02 16:36:18.175276
189	23	zdgxhxfxdgxd		medium	proposed	monday	2026-02-02	2026-02-02		2026-03-02 16:36:23.741316
176	3	856 Complete	MLF	medium	completed	monday	2026-03-09	2026-02-16		2026-02-18 17:14:14.562798
194	3	Prepare for Meeting	MLF	high	completed	tuesday	2026-03-09	2026-03-09		2026-03-09 12:20:27.168508
190	27	Complete flagged items	MLF	medium	proposed	monday	2026-03-02	2026-03-02		2026-03-02 17:33:20.52995
204	3	Call Rogers	Personal	medium	completed	wednesday	2026-03-16	2026-03-16		2026-03-18 15:59:11.835422
187	3	Alchemy complete	MLF	medium	completed	monday	2026-03-02	2026-03-02		2026-03-02 16:35:20.270702
184	3	Sending out Emails	MLF	medium	completed	tuesday	2026-03-02	2026-02-23		2026-02-26 21:02:44.658943
198	3	Plan out leaves	MLF	medium	completed	monday	2026-04-06	2026-03-16		2026-03-16 14:01:27.269927
191	3	Sending out more emails	MLF	medium	completed	wednesday	2026-03-02	2026-03-02		2026-03-05 16:43:25.989807
228	3	UAT Backup	MLF	medium	completed	wednesday	2026-03-30	2026-03-30		2026-03-30 13:37:28.50085
205	3	Kotak & ICICI Closure	Personal	medium	proposed	wednesday	2026-04-20	2026-03-16		2026-03-18 16:01:00.951058
213	3	Make script for Soul	MLF	medium	completed	tuesday	2026-03-23	2026-03-23		2026-03-25 19:00:33.861374
229	3	Send 997 Costco 824	MLF	medium	completed	monday	2026-04-06	2026-03-30		2026-03-30 19:53:33.17259
196	3	Complete Zendesk	MLF	medium	completed	monday	2026-03-16	2026-03-09		2026-03-10 19:03:34.865709
199	3	Call Naveen for whom gets error messege when the orders get into unprocessed logs	MLF	medium	completed	monday	2026-03-16	2026-03-16		2026-03-16 17:30:16.661099
200	3	Fill SPS Overwaitea	MLF	medium	completed	monday	2026-03-16	2026-03-16		2026-03-16 17:30:42.137819
209	3	Naveen changing 810	MLF	medium	completed	thursday	2026-03-23	2026-03-23		2026-03-23 14:58:52.978748
207	3	Zendesk AX complete	MLF	medium	completed	monday	2026-03-23	2026-03-23		2026-03-23 12:13:12.398102
227	3	Complete Overwaitea	MLF	medium	completed	monday	2026-03-30	2026-03-23		2026-03-27 18:47:48.63535
208	3	Prepare Tuesday meeting	MLF	medium	completed	monday	2026-03-23	2026-03-23		2026-03-23 12:13:28.855464
218	3	Remind iTrade	MLF	medium	completed	thursday	2026-03-30	2026-03-23		2026-03-26 16:57:16.671408
210	13	Complete 850 with SPS	MLF	medium	proposed	monday	2026-03-23	2026-03-23		2026-03-23 15:10:38.276485
211	13	Complete ticket 85200	MLF	medium	in_task	monday	2026-03-23	2026-03-23		2026-03-23 15:11:50.786076
201	3	Test 850 SPS	MLF	medium	completed	monday	2026-03-23	2026-03-16		2026-03-16 19:43:47.195698
214	3	Update Overwaitea ADO task	MLF	medium	completed	thursday	2026-03-23	2026-03-23		2026-03-26 15:43:14.795545
215	3	Mail Soul	MLF	medium	completed	thursday	2026-03-23	2026-03-23		2026-03-26 16:54:37.803708
226	3	Book Tickets	Personal	medium	in_task	thursday	2026-04-20	2026-03-23		2026-03-27 15:24:30.906782
219	3	Respond and complete Overwaitea	MLF	medium	completed	thursday	2026-03-23	2026-03-23		2026-03-26 16:57:38.704008
203	3	Shreeya Documents	Personal	medium	in_task	wednesday	2026-04-20	2026-03-16		2026-03-18 15:58:50.252813
220	3	Check Argano Tasks	MLF	medium	completed	thursday	2026-03-23	2026-03-23		2026-03-26 16:58:12.871047
222	3	Send Soul 810	MLF	medium	completed	friday	2026-03-23	2026-03-23		2026-03-26 20:05:41.532286
225	3	Complete 856	MLF	medium	completed	friday	2026-03-23	2026-03-23		2026-03-27 14:27:13.892548
221	3	Splitwise	Personal	medium	completed	friday	2026-04-06	2026-03-23		2026-03-26 18:09:43.671909
224	3	Take T2200	MLF	medium	completed	friday	2026-03-23	2026-03-23		2026-03-27 04:39:13.655224
223	3	Complete TD1	Personal	medium	completed	friday	2026-03-23	2026-03-23		2026-03-27 04:35:29.407733
202	3	OBVC-00002 change DUNS	MLF	medium	proposed	tuesday	2026-04-20	2026-03-16		2026-03-17 20:08:01.439253
206	3	Document date/time page for FO	MLF	medium	proposed	tuesday	2026-04-20	2026-03-16		2026-03-18 18:03:07.819449
197	3	Check 855 thoroughly	MLF	medium	completed	wednesday	2026-04-06	2026-03-16		2026-03-16 13:45:00.507105
212	3	PowerBI Report for Dashboard	MLF	medium	completed	monday	2026-03-30	2026-03-23		2026-03-24 19:22:06.132317
217	3	Check Metro Endpoint	MLF	medium	completed	wednesday	2026-03-30	2026-03-23		2026-03-26 16:57:01.642881
230	3	Call CRA	Personal	high	completed	friday	2026-04-13	2026-03-30		2026-04-01 04:23:19.411878
231	3	Complete Alchemy	MLF	medium	completed	thursday	2026-03-30	2026-03-30		2026-04-01 13:55:51.976043
244	3	Complete Costco	MLF	medium	hurdles	tuesday	2026-04-20	2026-04-13		2026-04-13 12:36:18.066639
247	3	Complete Longos	MLF	medium	hurdles	tuesday	2026-04-20	2026-04-13		2026-04-13 14:47:33.679239
216	3	Update list	MLF	medium	completed	monday	2026-04-06	2026-03-23		2026-03-26 16:56:33.347383
234	3	Remind Soul	MLF	medium	completed	tuesday	2026-04-06	2026-04-06		2026-04-06 14:45:47.318467
232	3	Complete refresh tasks	MLF	medium	completed	tuesday	2026-04-06	2026-04-06		2026-04-06 12:54:21.046735
253	3	Plan KT Session	MLF	medium	proposed	thursday	2026-04-20	2026-04-20		2026-04-21 18:40:55.583803
238	3	Send Rabba	MLF	medium	completed	wednesday	2026-04-06	2026-04-06		2026-04-08 14:15:16.118437
239	3	Overwaitea	MLF	medium	completed	wednesday	2026-04-06	2026-04-06		2026-04-08 14:15:37.597224
236	3	Complete EVP	MLF	medium	completed	wednesday	2026-04-06	2026-04-06		2026-04-08 14:14:27.58521
237	3	Send out iTrade	MLF	medium	completed	wednesday	2026-04-06	2026-04-06		2026-04-08 14:15:03.072481
241	3	Add discount	MLF	medium	completed	thursday	2026-04-06	2026-04-06		2026-04-08 16:10:44.731491
233	3	Complete smartserve	Personal	high	completed	thursday	2026-04-06	2026-04-06		2026-04-06 14:41:10.549248
240	3	Update tasks about EDI	MLF	medium	completed	friday	2026-04-06	2026-04-06		2026-04-08 14:58:39.563865
242	3	Book leaves	MLF	medium	completed	friday	2026-04-06	2026-04-06		2026-04-10 14:26:14.719928
235	3	Change CData secret	MLF	medium	completed	friday	2026-04-06	2026-04-06		2026-04-06 19:58:15.705457
245	3	Check SMTP connection secret	MLF	medium	completed	monday	2026-04-13	2026-04-13		2026-04-13 13:28:44.813973
250	3	Create iTrade script	MLF	medium	completed	wednesday	2026-04-13	2026-04-13		2026-04-13 18:39:01.372176
249	3	Compare POs	MLF	medium	completed	thursday	2026-04-13	2026-04-13		2026-04-13 17:35:03.195735
248	3	MW Check for EVP	MLF	medium	hurdles	monday	2026-04-20	2026-04-13		2026-04-13 17:32:23.397924
251	3	Call Sandeep	Personal	medium	in_task	tuesday	2026-04-20	2026-04-13		2026-04-14 14:18:30.879148
243	3	Document Cdata	MLF	medium	proposed	wednesday	2026-04-20	2026-04-13		2026-04-13 12:35:49.104199
246	3	Send EVP	MLF	medium	completed	tuesday	2026-04-20	2026-04-13		2026-04-13 13:28:58.657509
252	3	Find out about CData multiple connection	MLF	medium	in_task	wednesday	2026-04-20	2026-04-13		2026-04-17 17:20:30.792242
\.


--
-- Data for Name: team_invitations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.team_invitations (id, team_id, email, role, invited_by, status, sent_at, expires_at) FROM stdin;
10	6	test@example.com	member	11	pending	2025-09-24 03:39:12.722201	2025-10-01 03:39:12.703
17	1	ashutoshbpurani97@gmail.com	member	3	pending	2025-12-16 19:03:02.537308	2025-12-23 19:03:02.517
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.team_members (id, team_id, user_id, role, joined_at, last_active) FROM stdin;
1	1	3	owner	2025-09-11 01:27:57.906105	2025-09-11 01:27:57.906105
2	2	7	owner	2025-09-11 02:12:04.801184	2025-09-11 02:12:04.801184
3	3	8	owner	2025-09-11 04:03:52.95823	2025-09-11 04:03:52.95823
4	4	9	owner	2025-09-24 01:56:15.490915	2025-09-24 01:56:15.490915
5	5	10	owner	2025-09-24 03:28:48.500108	2025-09-24 03:28:48.500108
6	6	11	owner	2025-09-24 03:38:26.061602	2025-09-24 03:38:26.061602
7	7	12	owner	2025-09-24 03:57:49.936034	2025-09-24 03:57:49.936034
8	8	13	owner	2025-10-06 14:45:58.969787	2025-10-06 14:45:58.969787
9	9	15	owner	2025-10-25 05:34:37.633068	2025-10-25 05:34:37.633068
10	10	16	owner	2025-10-25 05:37:58.744152	2025-10-25 05:37:58.744152
11	11	17	owner	2025-11-13 05:10:10.361078	2025-11-13 05:10:10.361078
12	12	18	owner	2025-11-13 05:24:11.212138	2025-11-13 05:24:11.212138
13	13	19	owner	2025-11-13 05:42:26.778091	2025-11-13 05:42:26.778091
14	14	20	owner	2025-11-13 06:13:54.26945	2025-11-13 06:13:54.26945
15	15	21	owner	2025-11-13 07:33:11.944839	2025-11-13 07:33:11.944839
16	16	22	owner	2025-12-16 17:21:02.053836	2025-12-16 17:21:02.053836
17	17	23	owner	2025-12-16 17:24:44.784506	2025-12-16 17:24:44.784506
18	18	24	owner	2025-12-16 17:28:35.388387	2025-12-16 17:28:35.388387
19	19	6	owner	2025-12-29 16:40:53.71754	2025-12-29 16:40:53.71754
20	20	25	owner	2025-12-30 15:48:32.749079	2025-12-30 15:48:32.749079
21	21	26	owner	2026-01-30 14:52:59.300423	2026-01-30 14:52:59.300423
22	22	2	owner	2026-03-02 16:16:23.180849	2026-03-02 16:16:23.180849
23	23	27	owner	2026-03-02 17:32:54.469388	2026-03-02 17:32:54.469388
24	24	28	owner	2026-03-23 15:25:01.622246	2026-03-23 15:25:01.622246
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams (id, name, description, owner_id, created_at, updated_at) FROM stdin;
1	Ashu Purani's Team	Personal productivity workspace	3	2025-09-11 01:27:57.845614	2025-09-11 01:27:57.845614
2	John Doe's Team	Personal productivity workspace	7	2025-09-11 02:12:04.751776	2025-09-11 02:12:04.751776
3	TestUser_lZnP's Team	Personal productivity workspace	8	2025-09-11 04:03:52.908237	2025-09-11 04:03:52.908237
4	Test User's Team	Personal productivity workspace	9	2025-09-24 01:56:15.443688	2025-09-24 01:56:15.443688
5	John Doe's Team	Personal productivity workspace	10	2025-09-24 03:28:48.44719	2025-09-24 03:28:48.44719
6	John Doe's Team	Personal productivity workspace	11	2025-09-24 03:38:26.010987	2025-09-24 03:38:26.010987
7	Ashu Purani's Team	Personal productivity workspace	12	2025-09-24 03:57:49.890947	2025-09-24 03:57:49.890947
8	Ashu's Team	Personal productivity workspace	13	2025-10-06 14:45:58.918359	2025-10-06 14:45:58.918359
9	Ashu Purani's Team	Personal productivity workspace	15	2025-10-25 05:34:37.586064	2025-10-25 05:34:37.586064
10	Ashu Purani's Team	Personal productivity workspace	16	2025-10-25 05:37:58.696647	2025-10-25 05:37:58.696647
11	Test User's Team	Personal productivity workspace	17	2025-11-13 05:10:10.313006	2025-11-13 05:10:10.313006
12	Parth's Team	Personal productivity workspace	18	2025-11-13 05:24:11.160877	2025-11-13 05:24:11.160877
13	Launch Test User's Team	Personal productivity workspace	19	2025-11-13 05:42:26.733385	2025-11-13 05:42:26.733385
14	Logo Test's Team	Personal productivity workspace	20	2025-11-13 06:13:54.198136	2025-11-13 06:13:54.198136
15	Naisargi Pathak's Team	Personal productivity workspace	21	2025-11-13 07:33:11.898184	2025-11-13 07:33:11.898184
16	Pin Test User's Team	Personal productivity workspace	22	2025-12-16 17:21:02.004495	2025-12-16 17:21:02.004495
17	ashu's Team	Personal productivity workspace	23	2025-12-16 17:24:44.737243	2025-12-16 17:24:44.737243
18	Carry Test's Team	Personal productivity workspace	24	2025-12-16 17:28:35.321371	2025-12-16 17:28:35.321371
19	Chirag G Patel's Team	Personal productivity workspace	6	2025-12-29 16:40:53.661239	2025-12-29 16:40:53.661239
20	Ashu Purani's Team	Personal productivity workspace	25	2025-12-30 15:48:32.696858	2025-12-30 15:48:32.696858
21	John Doe's Team	Personal productivity workspace	26	2026-01-30 14:52:59.253986	2026-01-30 14:52:59.253986
22	Test User's Team	Personal productivity workspace	2	2026-03-02 16:16:23.126061	2026-03-02 16:16:23.126061
23	Ashu's Team	Personal productivity workspace	27	2026-03-02 17:32:54.420027	2026-03-02 17:32:54.420027
24	Ashu's Team	Personal productivity workspace	28	2026-03-23 15:25:01.574812	2026-03-23 15:25:01.574812
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, name, created_at, password, is_verified, updated_at) FROM stdin;
2	test@example.com	Test User	2025-08-07 00:19:31.77568	$2b$12$i9ZrT4nO9/NJ7k7Sf9mpDuGW7jEOQAAKJsVZVNfQ.5A9RA1nUX4ei	t	2025-08-07 00:19:32.164
26	testuser@test.com	John Doe	2026-01-30 14:52:57.606288	$2b$12$cfjZGw3v8XPGX.wX8oPDHOewHGlFllefUjOT2sIROeUIX.RNbR4FK	t	2026-01-30 14:52:57.931
4	youremail@gmail.com	Your Name	2025-08-07 00:25:18.594902	$2b$12$NeXm6yo6RxAvZk6atbgSxe6vnr9oCC6E7K91vBp8Vo6Pz08Qe23Pa	t	2025-08-07 00:25:19.083
5	ashub@gmail.com	Ashu	2025-08-07 15:41:27.091488	$2b$12$4W679s7CL8tFvHK7OMccd.oiOd/gO2WUlhQyi/WTiv9aRWk3WckOG	f	2025-08-07 15:41:27.091488
6	chiragpatel@gmail.com	Chirag G Patel	2025-08-10 22:35:37.303699	$2b$12$Kvp74YHcWCXYR5ChoZPtVuag1XowZOdjxhkacaIq4D8NNZlfqDZ1a	f	2025-08-10 22:35:37.303699
3	ashubpurani@gmail.com	Ashu Purani	2025-08-07 00:23:37.423376	$2b$12$Si1hCSUlimgannFyK1D9/.J0kGPZvtECcjVZWUhuukDXoAPqfy1oW	t	2025-08-07 00:23:37.423376
7	yrronr@example.com	John Doe	2025-09-11 02:12:02.714863	$2b$12$dvQU0G96bxqbJwgDI4nj7uL1HJasWysOikYgjuN1w1WGXjs65f6v6	t	2025-09-11 02:12:03.344
8	testuser_lznp@example.com	TestUser_lZnP	2025-09-11 04:03:50.839612	$2b$12$/GWLmbuiI7zhuHtF92KibeT9dsoDfYb1z1prfyf1Nhr01cSAqPCZ2	t	2025-09-11 04:03:51.387
1	debug@example.com	Debug User	2025-08-07 00:15:06.369639	$2b$12$DrPHdlQ3H9tNHeH/OwvXZeyzqx4ZvkXn/OAyWF7watwQMC3iWKQvq	t	2025-08-07 00:15:06.878
9	testuserommhgh@example.com	Test User	2025-09-24 01:56:13.28493	$2b$12$9Y9wBpDDmCWXV3r7k5vP4ues8BToUVR3PHFzD9rZBG.b9BWGBEAje	t	2025-09-24 01:56:13.875
10	tj1nnp@example.com	John Doe	2025-09-24 03:28:46.206001	$2b$12$0x.w6yK1G55nz62Z3hxL0ePtpWsdG5LvqtTAqUh82wuTkBF1WbfC2	t	2025-09-24 03:28:46.688
11	1ld7jh@example.com	John Doe	2025-09-24 03:38:24.066347	$2b$12$eNn2bJhpuZqug9.716k1Z.s/iTUat5CNMM6xNUU3EMaF4pMB8QucG	t	2025-09-24 03:38:24.438
12	ashutoshbpurani95@gmail.com	Ashu Purani	2025-09-24 03:57:47.907758	$2b$12$Z/54aM.XcevtK5jg6hrMS.krqBNZbD6vQrUhq9fXJAcsWJs5pAIVu	t	2025-09-24 03:57:48.158
13	ashutoshbpurani995@gmail.com	Ashu	2025-10-06 14:45:54.578052	$2b$12$h9omqkbzOEj.Y7YJLy/JSOZjFZQlZi8wGr.j/.lMwO3yZLDZsClVK	f	2025-10-06 14:45:54.578052
14	ashutoshbpurani96@gmail.com	Ashu Purani	2025-10-25 05:31:23.15757	$2b$12$mzWeqrfcsiwInJHp7lPqWu.tjVWNfdzPkpIzpwuyTbIjETQIRu7ze	f	2025-10-25 05:31:23.15757
15	ashutoshbpurani97@gmail.com	Ashu Purani	2025-10-25 05:34:35.171281	$2b$12$ZAL7XjjJdhkHXRHQELlLG.l5iTU.YdhDB1bXf9X00TzZlsd1mBfh.	t	2025-10-25 05:34:35.532
16	ashutoshbpurani94@gmail.com	Ashu Purani	2025-10-25 05:37:55.128936	$2b$12$.WPmnaRPtW2KD4z3dN1nx.mK4GwJaW8WH7C8ITT25nCIsx67KAKXi	t	2025-10-25 05:37:55.436
17	testuser_8onqyj@example.com	Test User	2025-11-13 05:10:06.469085	$2b$12$V48HYFJrcqs464nJOpUefuAhBUx.ayHaH0UnwDkICFhAl0U9iTik.	t	2025-11-13 05:10:06.791
18	parthpurani18@gmail.com	Parth	2025-11-13 05:24:08.519821	$2b$12$pfyC3Zu6i8mCt3SAX60MDOOuJkks9ZoDF09k0RSVIpMyrD7YeXmri	t	2025-11-13 05:24:08.896
19	testuser_fvdsml@example.com	Launch Test User	2025-11-13 05:42:24.929147	$2b$12$5.RhupWlqQZXKBf.k39tOOc1UPIcTC7TBkTNMyQE/cnKSfFvRd9H2	t	2025-11-13 05:42:25.31
20	test_logo_7n6c25@example.com	Logo Test	2025-11-13 06:13:51.943743	$2b$12$wzWMkYlkO27TCEfEJ1JSyusFcmfrQ/945k/GuMEgDN4BqOJdcfmf.	t	2025-11-13 06:13:52.37
21	pathaknaisargi05@gmail.com	Naisargi Pathak	2025-11-13 07:33:08.558517	$2b$12$Cno2AeHkp711OW502yje4.KhvMgIXYimYsCysLwM5.SWuvPcR/OX.	t	2025-11-13 07:33:08.864
22	test_pin_moh2bs@example.com	Pin Test User	2025-12-16 17:21:00.111321	$2b$12$nux756wrRj9ct8wtpEmT/u14FXNXv6D4Q2xqrMS.g/uMvjT4bxupm	t	2025-12-16 17:21:00.424
23	ashupurani@gmail.com	ashu	2025-12-16 17:24:42.103075	$2b$12$FyD6IQnGZFVOoMHzTC3yieNPZ0XJBoStaN5pI3KevS1ak2t5/8oZK	t	2025-12-16 17:24:42.752
24	carry_test_gxtaub@example.com	Carry Test	2025-12-16 17:28:33.532801	$2b$12$v5xEl2NJTNleV75M0cbfXupl634xCjA91/Xbai/1Ay7i/EPC3RdAS	t	2025-12-16 17:28:33.837
25	ashubpurani99@gmail.com	Ashu Purani	2025-12-30 15:48:31.060204	$2b$12$bVSOGlhJ6E1hkTG7JQkzIuqjkz5KbCTxx7bM364utbCEiyyb4Tz3i	t	2025-12-30 15:48:31.368
27	apurani@maplelodgefarms.com	Ashu	2026-03-02 17:32:50.862562	$2b$12$gkKXUumzWf64E9OSgE7Dy.NizKzLdKYftrAxiY8x/V5UMtFtddYXK	t	2026-03-02 17:32:51.178
28	ashu@gmail.com	Ashu	2026-03-23 15:24:59.456727	$2b$12$GT3jnIXTeAxOWeWEks.xHuMf6Vlpr0jzQRA6SjxKPbUd1x7IOj07e	t	2026-03-23 15:24:59.738
\.


--
-- Name: enhanced_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.enhanced_tasks_id_seq', 1, false);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goals_id_seq', 4, true);


--
-- Name: habit_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.habit_entries_id_seq', 178, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.habits_id_seq', 27, true);


--
-- Name: milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.milestones_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: pomodoro_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pomodoro_sessions_id_seq', 7, true);


--
-- Name: task_time_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.task_time_entries_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tasks_id_seq', 253, true);


--
-- Name: team_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.team_invitations_id_seq', 17, true);


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.team_members_id_seq', 24, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_id_seq', 24, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 28, true);


--
-- Name: enhanced_tasks enhanced_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enhanced_tasks
    ADD CONSTRAINT enhanced_tasks_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: habit_entries habit_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.habit_entries
    ADD CONSTRAINT habit_entries_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_sessions pomodoro_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);


--
-- Name: task_time_entries task_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_time_entries
    ADD CONSTRAINT task_time_entries_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_invitations team_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: goals goals_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: habit_entries habit_entries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.habit_entries
    ADD CONSTRAINT habit_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: habits habits_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: milestones milestones_goal_id_goals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_goal_id_goals_id_fk FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pomodoro_sessions pomodoro_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pomodoro_sessions
    ADD CONSTRAINT pomodoro_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_time_entries task_time_entries_task_id_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_time_entries
    ADD CONSTRAINT task_time_entries_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: team_invitations team_invitations_invited_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_invited_by_users_id_fk FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: team_invitations team_invitations_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teams teams_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict fd4dgr1imfEj6wLiNEteN1q5wZVNfPGogW7Rqo9u7LMQupn0Cu6xCvL5bogPeIi

