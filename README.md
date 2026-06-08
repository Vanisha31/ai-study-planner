# StudySync AI

StudySync AI is an adaptive study intelligence dashboard for students who are handling exams, assignments, placements, projects, and missed study days at the same time.

The project proves that a study planner can still be useful today when it is adaptive, pressure-aware, and connected to real student workflows instead of being only a static timetable.

## Live Project Story

Most students do not fail because they never made a timetable. They fail because the timetable stops working when:

- exam dates get close
- confidence drops in one subject
- they miss study hours
- notes become too long to revise
- placement preparation competes with semester subjects

StudySync AI solves this by turning a student's current situation into a practical plan for today, this week, and the next exam.

## Key Features

- AI Priority Engine that ranks subjects by exam urgency, difficulty, confidence, and available weekly hours
- Personal AI Study Coach that tells the student what to study today
- Rescue Mode that rebuilds the week when study hours are missed
- 7-day adaptive schedule based on morning, balanced, or night study style
- Readiness score and life-fit score to show whether the plan is realistic
- Smart Notes Companion that converts rough notes into summaries and flashcards
- Career Bridge that connects topics with placement or interview-ready explanations
- Curriculum burn-down chart for visual progress tracking
- Google Calendar export links for adaptive weekly study blocks
- Student login/workspace demo with local cloud-sync snapshots
- Completed focus-session analytics with total time, consistency, and top subject
- Browser storage so subjects, notes, goals, and settings stay saved after refresh
- Export option to download the generated plan as a text file

## Why Gen Z Can Use It Today

This is not just a timetable app. It is useful for students who want one place to manage:

- college exam preparation
- placement and interview revision
- competitive exam pressure
- missed study days
- quick note revision
- realistic weekly study planning

The app helps students decide what deserves attention first, instead of treating every subject equally.

## Tech Stack

- React 18
- Vite
- JavaScript
- CSS
- Local browser storage

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```bash
npm run build
```

The production files are created in `dist`.

## Deploy On Vercel

Use these settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

No backend or environment variables are required for the current version.

## Future Scope

- Add real LLM-powered note summarization
- Add voice-based task capture
- Add peer study-room matching

## Demo Positioning

Use this one-line explanation while presenting:

> StudySync AI helps students recover from real academic pressure by ranking what to study first, rebuilding missed schedules, summarizing notes, and connecting revision with career goals.
