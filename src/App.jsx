import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ai-study-planner-v2";

function dateAfter(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const defaultSubjects = [
  {
    name: "Data Structures",
    examDate: dateAfter(12),
    difficulty: 5,
    confidence: 42,
    syllabus: "Trees, graphs, dynamic programming, hashing, recursion",
  },
  {
    name: "Operating Systems",
    examDate: dateAfter(18),
    difficulty: 4,
    confidence: 58,
    syllabus: "Scheduling, deadlocks, memory management, file systems",
  },
  {
    name: "Database Systems",
    examDate: dateAfter(27),
    difficulty: 3,
    confidence: 71,
    syllabus: "SQL joins, normalization, transactions, indexing",
  },
];

const studyMethods = [
  "Active recall",
  "Past-paper practice",
  "Spaced revision",
  "Concept mapping",
  "Teach-back review",
];

const projectIdeas = [
  "Plan around college, internships, placements, and competitive exams in one screen",
  "Recover missed study hours without manually rebuilding a timetable",
  "Turn rough notes into quick revision cards before a test",
  "Connect each topic with a career skill students can explain in interviews",
];

const goalProfiles = {
  semester: {
    title: "Semester survival mode",
    copy: "Balances unit tests, assignments, attendance pressure, and end-semester revision.",
    skill: "Build a clean revision rhythm and reduce last-night overload.",
  },
  placement: {
    title: "Placement prep mode",
    copy: "Pushes DSA, DBMS, OS, aptitude, and interview confidence into the weekly plan.",
    skill: "Convert academic topics into interview-ready explanations.",
  },
  competitive: {
    title: "Competitive exam mode",
    copy: "Prioritizes speed, accuracy, mock-test review, and spaced revision under deadline pressure.",
    skill: "Use timed practice and error analysis instead of passive rereading.",
  },
};

const defaultStudentProfile = {
  name: "Vanisha",
  email: "student@studysync.ai",
  cloudId: "STUDY-2026",
};

function loadSavedState() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function daysUntil(dateValue) {
  const today = new Date();
  const exam = new Date(`${dateValue}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : 30;
}

function getPriority(subject) {
  const days = Math.max(daysUntil(subject.examDate), 1);
  const weakScore = 100 - subject.confidence;
  const urgency = Math.max(0, 45 - days) * 2;
  return subject.difficulty * 15 + weakScore + urgency;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function App() {
  const savedState = useMemo(loadSavedState, []);
  const [subjects, setSubjects] = useState(savedState?.subjects || defaultSubjects);
  const [subjectDraft, setSubjectDraft] = useState({
    name: "",
    examDate: "",
    difficulty: 3,
    confidence: 50,
    syllabus: "",
  });
  const [weeklyHours, setWeeklyHours] = useState(savedState?.weeklyHours || 18);
  const [dailyEnergy, setDailyEnergy] = useState(savedState?.dailyEnergy || "medium");
  const [chronotype, setChronotype] = useState(savedState?.chronotype || "morning");
  const [goal, setGoal] = useState(savedState?.goal || "semester");
  const [missedHours, setMissedHours] = useState(savedState?.missedHours || 2);
  const [rescueMode, setRescueMode] = useState(false);
  const [activeFocus, setActiveFocus] = useState("");
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [completedSessions, setCompletedSessions] = useState(savedState?.completedSessions || []);
  const [studentProfile, setStudentProfile] = useState(savedState?.studentProfile || defaultStudentProfile);
  const [profileDraft, setProfileDraft] = useState(savedState?.studentProfile || defaultStudentProfile);
  const [syncMessage, setSyncMessage] = useState(savedState?.syncMessage || "Last cloud sync snapshot is ready locally.");
  const [uploadMessage, setUploadMessage] = useState("");
  const [notes, setNotes] = useState(
    savedState?.notes ||
      "Graph traversal includes BFS and DFS. BFS uses a queue and is useful for shortest path in unweighted graphs. DFS uses recursion or a stack and helps with cycle detection, topological sorting, and connected components."
  );

  const plan = useMemo(() => buildPlan(subjects, weeklyHours, dailyEnergy), [subjects, weeklyHours, dailyEnergy]);
  const recoveryPlan = useMemo(() => buildRecoveryPlan(plan, missedHours), [plan, missedHours]);
  const weeklySchedule = useMemo(
    () => buildWeeklySchedule(plan, weeklyHours, chronotype, rescueMode, missedHours),
    [plan, weeklyHours, chronotype, rescueMode, missedHours]
  );
  const riskAlerts = useMemo(() => buildRiskAlerts(subjects, weeklyHours), [subjects, weeklyHours]);
  const summary = useMemo(() => summarizeNotes(notes), [notes]);
  const flashcards = useMemo(() => generateFlashcards(notes), [notes]);
  const burnDown = useMemo(() => buildBurnDown(subjects), [subjects]);
  const focusAnalytics = useMemo(() => buildFocusAnalytics(completedSessions, plan), [completedSessions, plan]);

  const readiness = useMemo(() => {
    if (!subjects.length) return 0;
    const avgConfidence = subjects.reduce((sum, subject) => sum + subject.confidence, 0) / subjects.length;
    const urgentLoad = subjects.reduce((sum, subject) => sum + (daysUntil(subject.examDate) < 7 ? 8 : 0), 0);
    return clamp(Math.round(avgConfidence - urgentLoad + weeklyHours * 0.8), 0, 100);
  }, [subjects, weeklyHours]);
  const todayCoach = useMemo(() => buildTodayCoach(plan, riskAlerts, goal), [goal, plan, riskAlerts]);
  const lifeFit = useMemo(() => buildLifeFitScore(readiness, missedHours, weeklyHours), [missedHours, readiness, weeklyHours]);
  const careerBridge = useMemo(() => buildCareerBridge(plan, goal), [goal, plan]);

  useEffect(() => {
    if (!activeFocus || focusSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setFocusSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeFocus, focusSeconds]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        subjects,
        weeklyHours,
        dailyEnergy,
        chronotype,
        goal,
        missedHours,
        notes,
        completedSessions,
        studentProfile,
        syncMessage,
      })
    );
  }, [
    chronotype,
    completedSessions,
    dailyEnergy,
    goal,
    missedHours,
    notes,
    studentProfile,
    subjects,
    syncMessage,
    weeklyHours,
  ]);

  const addSubject = () => {
    if (!subjectDraft.name.trim() || !subjectDraft.examDate) return;
    setSubjects((current) => [...current, { ...subjectDraft, name: subjectDraft.name.trim() }]);
    setSubjectDraft({ name: "", examDate: "", difficulty: 3, confidence: 50, syllabus: "" });
  };

  const removeSubject = (name) => {
    setSubjects((current) => current.filter((subject) => subject.name !== name));
  };

  const updateSubject = (name, patch) => {
    setSubjects((current) =>
      current.map((subject) => (subject.name === name ? { ...subject, ...patch } : subject))
    );
  };

  const startFocus = (subjectName) => {
    setActiveFocus(subjectName);
    setFocusSeconds(25 * 60);
  };

  const completeFocusSession = (subjectName) => {
    const minutes = Math.max(1, Math.round((25 * 60 - focusSeconds) / 60));
    setCompletedSessions((current) => [
      {
        id: `${Date.now()}-${subjectName}`,
        subject: subjectName,
        minutes,
        method: plan.find((item) => item.name === subjectName)?.method || "Focused revision",
        date: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 18));
    setActiveFocus("");
    setFocusSeconds(25 * 60);
  };

  const saveStudentProfile = () => {
    setStudentProfile({
      name: profileDraft.name.trim() || "StudySync Student",
      email: profileDraft.email.trim() || "student@studysync.ai",
      cloudId: profileDraft.cloudId.trim() || "STUDY-2026",
    });
    setSyncMessage(`Cloud sync snapshot saved for ${profileDraft.email || "student"} at ${new Date().toLocaleTimeString()}.`);
  };

  const syncWorkspace = () => {
    setSyncMessage(`Plan, notes, subjects, and ${completedSessions.length} focus session${completedSessions.length === 1 ? "" : "s"} synced locally for ${studentProfile.cloudId}.`);
  };

  const resetDemo = () => {
    setSubjects(defaultSubjects);
    setWeeklyHours(18);
    setDailyEnergy("medium");
    setChronotype("morning");
    setGoal("semester");
    setMissedHours(2);
    setCompletedSessions([]);
    setStudentProfile(defaultStudentProfile);
    setProfileDraft(defaultStudentProfile);
    setSyncMessage("Demo data restored and local cloud snapshot reset.");
    setNotes(
      "Graph traversal includes BFS and DFS. BFS uses a queue and is useful for shortest path in unweighted graphs. DFS uses recursion or a stack and helps with cycle detection, topological sorting, and connected components."
    );
    setUploadMessage("Demo data restored.");
  };

  const exportPlan = () => {
    const text = buildShareablePlan(plan, weeklySchedule, todayCoach, goal);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-study-plan.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMaterialUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      setUploadMessage(`${file.name} uploaded. PDF parsing is LLM-ready; paste extracted text below for local flashcards.`);
      return;
    }

    const text = await file.text();
    setNotes(text.slice(0, 6000));
    setUploadMessage(`${file.name} added to Smart Notes Companion.`);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Next-gen student planning OS</p>
          <h1>StudySync AI</h1>
          <p className="hero-copy">
            An adaptive study intelligence dashboard for students balancing exams, placements, projects, part-time work,
            social life, and burnout. It turns messy academic pressure into a daily plan students can actually follow.
          </p>
          <div className="hero-proof">
            <span>Adaptive timetable</span>
            <span>Notes to flashcards</span>
            <span>Missed-day recovery</span>
            <span>Career-linked revision</span>
          </div>
        </div>
        <div className="readiness-card">
          <span>Exam readiness</span>
          <strong>{readiness}%</strong>
          <div className="meter">
            <span style={{ width: `${readiness}%` }} />
          </div>
          <div className="readiness-meta">
            <span>{lifeFit.label}</span>
            <span>{goalProfiles[goal].title}</span>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="control-panel">
          <div className="panel-head">
            <h2>Planner Inputs</h2>
            <p>Adjust the student situation and the plan updates instantly.</p>
          </div>

          <label>
            Weekly study capacity
            <input
              type="range"
              min="6"
              max="42"
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(Number(event.target.value))}
            />
            <span className="input-note">{weeklyHours} focused hours this week</span>
          </label>

          <div className="segmented">
            {["low", "medium", "high"].map((energy) => (
              <button
                key={energy}
                className={dailyEnergy === energy ? "active" : ""}
                onClick={() => setDailyEnergy(energy)}
              >
                {energy} energy
              </button>
            ))}
          </div>

          <div className="segmented">
            {[
              ["morning", "Morning owl"],
              ["balanced", "Balanced"],
              ["night", "Night owl"],
            ].map(([value, label]) => (
              <button key={value} className={chronotype === value ? "active" : ""} onClick={() => setChronotype(value)}>
                {label}
              </button>
            ))}
          </div>

          <div className="segmented">
            {[
              ["semester", "Semester"],
              ["placement", "Placement"],
              ["competitive", "Competitive exam"],
            ].map(([value, label]) => (
              <button key={value} className={goal === value ? "active" : ""} onClick={() => setGoal(value)}>
                {label}
              </button>
            ))}
          </div>

          <label>
            Missed hours this week
            <input
              type="number"
              min="0"
              max="20"
              value={missedHours}
              onChange={(event) => setMissedHours(Number(event.target.value))}
            />
          </label>

          <button className="primary-button" onClick={() => setRescueMode((enabled) => !enabled)}>
            {rescueMode ? "Rescue plan active" : "Rescue Me"}
          </button>
          <div className="action-stack">
            <button className="ghost-button" onClick={exportPlan}>Export plan</button>
            <button className="ghost-button" onClick={resetDemo}>Reset demo</button>
          </div>
        </section>

        <section className="coach-panel">
          <div className="panel-head">
            <h2>Personal AI Study Coach</h2>
            <p>Shows what a student should do today, not just a generic timetable.</p>
          </div>
          <div className="coach-grid">
            <article className="coach-card primary">
              <span>Today</span>
              <h3>{todayCoach.mainTask}</h3>
              <p>{todayCoach.reason}</p>
            </article>
            <article className="coach-card">
              <span>Life-fit score</span>
              <h3>{lifeFit.score}/100</h3>
              <p>{lifeFit.copy}</p>
            </article>
            <article className="coach-card">
              <span>{goalProfiles[goal].title}</span>
              <h3>{goalProfiles[goal].skill}</h3>
              <p>{goalProfiles[goal].copy}</p>
            </article>
          </div>
        </section>

        <section className="hero-panel">
          <div className="panel-head">
            <h2>AI Priority Engine</h2>
            <p>Focuses first on urgent, difficult, low-confidence topics.</p>
          </div>
          <div className="priority-list">
            {plan.map((item, index) => (
              <article key={item.name} className="priority-card">
                <div className="rank">{index + 1}</div>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.reason}</p>
                  <div className="chip-row">
                    <span>{item.hours} hrs</span>
                    <span>{item.method}</span>
                    <span>{item.daysLeft} days left</span>
                  </div>
                  <div className="focus-row">
                    <button className="ghost-button" onClick={() => startFocus(item.name)}>
                      Start focus
                    </button>
                    {activeFocus === item.name && (
                      <>
                        <strong className={focusSeconds === 0 ? "timer done" : "timer"}>
                          {focusSeconds === 0 ? "Session complete" : formatTime(focusSeconds)}
                        </strong>
                        <button className="ghost-button" onClick={() => completeFocusSession(item.name)}>
                          Mark complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="account-panel">
          <div className="panel-head">
            <h2>Student Login and Cloud Sync</h2>
            <p>A demo student workspace that saves the planner, notes, and progress snapshot in browser storage.</p>
          </div>
          <div className="account-grid">
            <label>
              Student name
              <input
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileDraft.email}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, email: event.target.value }))}
              />
            </label>
            <label>
              Cloud ID
              <input
                value={profileDraft.cloudId}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, cloudId: event.target.value }))}
              />
            </label>
          </div>
          <div className="sync-card">
            <div>
              <span>Signed in as</span>
              <strong>{studentProfile.name}</strong>
              <p>{studentProfile.email} - Workspace {studentProfile.cloudId}</p>
            </div>
            <div className="sync-actions">
              <button className="primary-button" onClick={saveStudentProfile}>Save login</button>
              <button className="ghost-button" onClick={syncWorkspace}>Sync workspace</button>
            </div>
          </div>
          <p className="sync-message">{syncMessage}</p>
        </section>

        <section className="subject-panel">
          <div className="panel-head">
            <h2>Subjects and Weak Areas</h2>
            <p>Confidence sliders make the planner adaptive, not fixed.</p>
          </div>

          <div className="subject-grid">
            {subjects.map((subject) => (
              <article key={subject.name} className="subject-card">
                <div className="subject-title">
                  <div>
                    <h3>{subject.name}</h3>
                    <p>{subject.syllabus || "No syllabus added"}</p>
                  </div>
                  <button className="ghost-button" onClick={() => removeSubject(subject.name)}>
                    Remove
                  </button>
                </div>
                <label>
                  Confidence: {subject.confidence}%
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={subject.confidence}
                    onChange={(event) => updateSubject(subject.name, { confidence: Number(event.target.value) })}
                  />
                </label>
                <div className="stat-row">
                  <span>Difficulty {subject.difficulty}/5</span>
                  <span>{daysUntil(subject.examDate)} days left</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="add-panel">
          <div className="panel-head">
            <h2>Add New Subject</h2>
            <p>Useful for changing exam timetables or new weak units.</p>
          </div>
          <div className="form-grid">
            <input
              placeholder="Subject name"
              value={subjectDraft.name}
              onChange={(event) => setSubjectDraft((draft) => ({ ...draft, name: event.target.value }))}
            />
            <input
              type="date"
              value={subjectDraft.examDate}
              onChange={(event) => setSubjectDraft((draft) => ({ ...draft, examDate: event.target.value }))}
            />
            <input
              type="number"
              min="1"
              max="5"
              value={subjectDraft.difficulty}
              onChange={(event) => setSubjectDraft((draft) => ({ ...draft, difficulty: Number(event.target.value) }))}
            />
            <input
              placeholder="Syllabus topics"
              value={subjectDraft.syllabus}
              onChange={(event) => setSubjectDraft((draft) => ({ ...draft, syllabus: event.target.value }))}
            />
          </div>
          <button className="primary-button" onClick={addSubject}>Add subject to plan</button>
        </section>

        <section className="insight-panel">
          <div className="panel-head">
            <h2>Realtime Recovery Plan</h2>
            <p>When students miss study time, the app reshuffles instead of failing.</p>
          </div>
          <div className="timeline">
            {recoveryPlan.map((item) => (
              <div key={item.slot} className="timeline-item">
                <span>{item.slot}</span>
                <strong>{item.task}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="schedule-panel">
          <div className="panel-head">
            <h2>7-Day Adaptive Schedule</h2>
            <p>A practical week plan students can follow without manually creating a timetable.</p>
          </div>
          <div className="week-grid">
            {weeklySchedule.map((day) => (
              <article key={day.day} className="day-card">
                <span>{day.day}</span>
                <strong>{day.subject}</strong>
                <p>{day.task}</p>
                <em>{day.window}</em>
                <small>{day.duration}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="calendar-panel">
          <div className="panel-head">
            <h2>Google Calendar Sync</h2>
            <p>Export the adaptive week plan into Google Calendar with ready-to-add study events.</p>
          </div>
          <div className="calendar-grid">
            {weeklySchedule.slice(0, 4).map((day, index) => (
              <article key={`${day.day}-${day.subject}`} className="calendar-card">
                <span>{day.day}</span>
                <strong>{day.subject}</strong>
                <p>{day.task}</p>
                <a href={buildGoogleCalendarUrl(day, index)} target="_blank" rel="noreferrer">
                  Add to Google Calendar
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="burndown-panel">
          <div className="panel-head">
            <h2>Curriculum Burn-down</h2>
            <p>Shows how the remaining syllabus should shrink before the nearest exam.</p>
          </div>
          <div className="chart-card">
            <svg viewBox="0 0 640 220" role="img" aria-label="Curriculum burn-down chart">
              <polyline className="target-line" points={burnDown.targetPoints} />
              <polyline className="actual-line" points={burnDown.actualPoints} />
              {burnDown.markers.map((marker) => (
                <circle key={`${marker.x}-${marker.y}`} cx={marker.x} cy={marker.y} r="5" />
              ))}
            </svg>
            <div className="legend-row">
              <span><i className="target-dot" /> Ideal syllabus burn-down</span>
              <span><i className="actual-dot" /> Current confidence trajectory</span>
            </div>
          </div>
        </section>

        <section className="analytics-panel">
          <div className="panel-head">
            <h2>Completed Focus Analytics</h2>
            <p>Tracks finished focus sessions so students can see effort, consistency, and strongest subjects.</p>
          </div>
          <div className="analytics-grid">
            <article>
              <span>Total focus</span>
              <strong>{focusAnalytics.totalMinutes} min</strong>
              <p>{focusAnalytics.sessionCount} completed sessions</p>
            </article>
            <article>
              <span>Best subject</span>
              <strong>{focusAnalytics.topSubject}</strong>
              <p>{focusAnalytics.topSubjectMinutes} focused minutes</p>
            </article>
            <article>
              <span>Consistency</span>
              <strong>{focusAnalytics.streakLabel}</strong>
              <p>{focusAnalytics.tip}</p>
            </article>
          </div>
          <div className="session-list">
            {completedSessions.length ? completedSessions.slice(0, 5).map((session) => (
              <div key={session.id}>
                <strong>{session.subject}</strong>
                <span>{session.minutes} min - {session.method}</span>
              </div>
            )) : (
              <div>
                <strong>No completed sessions yet</strong>
                <span>Start a focus block and mark it complete to create analytics.</span>
              </div>
            )}
          </div>
        </section>

        <section className="risk-panel">
          <div className="panel-head">
            <h2>Risk Alerts</h2>
            <p>Flags the problems that usually break student study plans.</p>
          </div>
          <div className="alert-grid">
            {riskAlerts.map((alert) => (
              <article key={alert.title} className={`risk-card ${alert.level}`}>
                <span>{alert.levelLabel}</span>
                <h3>{alert.title}</h3>
                <p>{alert.message}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="career-panel">
          <div className="panel-head">
            <h2>Career Bridge</h2>
            <p>Helps students answer the question: why should I study this today?</p>
          </div>
          <div className="career-grid">
            {careerBridge.map((item) => (
              <article key={item.topic} className="career-card">
                <span>{item.topic}</span>
                <h3>{item.skill}</h3>
                <p>{item.pitch}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="notes-panel">
          <div className="panel-head">
            <h2>Smart Notes Companion</h2>
            <p>Turns rough notes into revision points and quiz prompts.</p>
          </div>
          <label className="upload-card">
            Upload notes or PDF
            <input type="file" accept=".txt,.md,.pdf,text/plain,application/pdf" onChange={handleMaterialUpload} />
            <span>{uploadMessage || "Text files generate local flashcards instantly; PDFs are ready for backend LLM parsing."}</span>
          </label>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="summary-card">
            <h3>Generated Revision Summary</h3>
            <p>{summary}</p>
          </div>
          <div className="flashcard-grid">
            {flashcards.map((card) => (
              <article key={card.question} className="flashcard">
                <strong>{card.question}</strong>
                <p>{card.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="future-panel">
          <div className="panel-head">
            <h2>Why This Matters Today</h2>
            <p>A stronger project story for teachers, interviews, and resume discussion.</p>
          </div>
          <div className="future-grid">
            <article>
              <h3>Modern problem</h3>
              <p>Students do not only need a timetable. They need adaptive planning around exam stress, confidence gaps, missed days, and career goals.</p>
            </article>
            <article>
              <h3>AI angle</h3>
              <p>The planner behaves like a decision engine: it ranks urgency, recommends methods, and converts notes into revision output.</p>
            </article>
            <article>
              <h3>Upcoming scope</h3>
              <p>Now includes calendar export, student workspace sync, and focus analytics; next it can grow into voice doubt capture and peer study rooms.</p>
            </article>
          </div>
        </section>

        <section className="project-panel">
          <div className="panel-head">
            <h2>Realtime Feature Ideas</h2>
            <p>These make the project sound useful for current and future students.</p>
          </div>
          <div className="idea-list">
            {projectIdeas.map((idea) => <span key={idea}>{idea}</span>)}
          </div>
        </section>

        <section className="brief-panel">
          <div className="panel-head">
            <h2>Teacher Demo Brief</h2>
            <p>A concise explanation you can use while presenting the project.</p>
          </div>
          <div className="brief-card">
            <p>
              This project solves a real student problem: normal study planners become useless when exam dates change,
              confidence drops, or students miss study hours. The app uses priority scoring to recommend what to study
              first, creates a recovery plan, summarizes notes, and connects learning with placement-ready skills.
            </p>
            <div className="brief-points">
              <span>Adaptive planning</span>
              <span>Exam pressure aware</span>
              <span>Works offline in browser</span>
              <span>Future-ready for AI/calendar sync</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function buildGoogleCalendarUrl(day, index) {
  const start = new Date();
  start.setDate(start.getDate() + index);
  start.setHours(18 + (index % 2), 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 60);
  const formatCalendarDate = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `StudySync AI: ${day.subject}`,
    details: `${day.task} Duration: ${day.duration}. Planned by StudySync AI.`,
    dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildFocusAnalytics(completedSessions, plan) {
  const totalMinutes = completedSessions.reduce((sum, session) => sum + session.minutes, 0);
  const subjectTotals = completedSessions.reduce((totals, session) => {
    totals[session.subject] = (totals[session.subject] || 0) + session.minutes;
    return totals;
  }, {});
  const topEntry = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1])[0];
  const uniqueDays = new Set(completedSessions.map((session) => session.date.slice(0, 10))).size;
  const nextPriority = plan[0]?.name || "your top priority";

  return {
    totalMinutes,
    sessionCount: completedSessions.length,
    topSubject: topEntry?.[0] || nextPriority,
    topSubjectMinutes: topEntry?.[1] || 0,
    streakLabel: uniqueDays ? `${uniqueDays} active day${uniqueDays === 1 ? "" : "s"}` : "Start today",
    tip: completedSessions.length
      ? `Next best session: ${nextPriority} with active recall.`
      : `Begin with ${nextPriority} to create your first progress signal.`,
  };
}

function buildPlan(subjects, weeklyHours, dailyEnergy) {
  const totalPriority = subjects.reduce((sum, subject) => sum + getPriority(subject), 0) || 1;
  const energyMultiplier = dailyEnergy === "high" ? 1.1 : dailyEnergy === "low" ? 0.82 : 1;

  return [...subjects]
    .sort((a, b) => getPriority(b) - getPriority(a))
    .map((subject, index) => {
      const daysLeft = daysUntil(subject.examDate);
      const hours = Math.max(1.5, (weeklyHours * energyMultiplier * getPriority(subject)) / totalPriority);
      const method = studyMethods[index % studyMethods.length];
      const reason =
        subject.confidence < 50
          ? "Low confidence detected. Start with recall drills, then solve timed questions."
          : daysLeft < 7
            ? "Exam is close. Use revision sprints and previous-year questions."
            : "Stable topic. Keep it warm with spaced review and short practice sets.";

      return {
        name: subject.name,
        hours: hours.toFixed(1),
        method,
        daysLeft,
        reason,
      };
    });
}

function buildTodayCoach(plan, riskAlerts, goal) {
  const top = plan[0];
  const risk = riskAlerts[0];
  const profile = goalProfiles[goal];

  if (!top) {
    return {
      mainTask: "Add your first subject",
      reason: "The coach needs exam date, confidence, and syllabus topics before it can build a smart plan.",
    };
  }

  return {
    mainTask: `${top.hours} hrs on ${top.name}`,
    reason: `${top.reason} ${risk?.title ? `Main risk: ${risk.title.toLowerCase()}.` : ""} ${profile.skill}`,
  };
}

function buildLifeFitScore(readiness, missedHours, weeklyHours) {
  const score = clamp(Math.round(readiness - missedHours * 1.8 + Math.min(weeklyHours, 28) * 0.7), 0, 100);

  if (score >= 75) {
    return {
      score,
      label: "Healthy rhythm",
      copy: "The plan has enough study capacity without pushing every day into emergency mode.",
    };
  }

  if (score >= 50) {
    return {
      score,
      label: "Needs adjustment",
      copy: "The week is possible, but missed hours and weak topics need a tighter recovery plan.",
    };
  }

  return {
    score,
    label: "High pressure",
    copy: "The student should reduce low-value tasks and focus only on the highest scoring topics first.",
  };
}

function buildCareerBridge(plan, goal) {
  const fallback = [
    { name: "Priority topic", method: "Active recall" },
    { name: "Mock test review", method: "Error analysis" },
    { name: "Revision notes", method: "Flashcards" },
  ];
  const source = plan.length ? plan.slice(0, 3) : fallback;

  return source.map((item) => {
    const topic = item.name;
    const placementPitch =
      goal === "placement"
        ? "Practice explaining this in two minutes like an interview answer."
        : goal === "competitive"
          ? "Convert mistakes into a speed-and-accuracy checklist for the next mock."
          : "Link this topic to one practical example so revision feels useful today.";

    return {
      topic,
      skill: `${item.method} for real outcomes`,
      pitch: placementPitch,
    };
  });
}

function buildShareablePlan(plan, weeklySchedule, todayCoach, goal) {
  const lines = [
    "StudySync AI",
    `Mode: ${goalProfiles[goal].title}`,
    "",
    `Today: ${todayCoach.mainTask}`,
    todayCoach.reason,
    "",
    "Top priorities:",
    ...plan.map((item, index) => `${index + 1}. ${item.name} - ${item.hours} hrs - ${item.method}`),
    "",
    "7-day schedule:",
    ...weeklySchedule.map((day) => `${day.day}: ${day.subject} - ${day.task} (${day.duration}, ${day.window})`),
  ];

  return lines.join("\n");
}

function buildRecoveryPlan(plan, missedHours) {
  const topSubject = plan[0]?.name || "highest priority subject";
  const secondSubject = plan[1]?.name || "next weak subject";

  return [
    {
      slot: "Today",
      task: `Recover ${Math.min(missedHours, 2)} focused hrs`,
      detail: `Use one deep-work block for ${topSubject}; skip passive reading.`,
    },
    {
      slot: "Tomorrow",
      task: "Compress low-value tasks",
      detail: `Move easy revision into flashcards and give the saved time to ${secondSubject}.`,
    },
    {
      slot: "Weekend",
      task: "Reality check",
      detail: "Take one timed mini-test and update confidence scores before the next plan.",
    },
  ];
}

function buildWeeklySchedule(plan, weeklyHours, chronotype, rescueMode, missedHours) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyLoad = Math.max(45, Math.round(((weeklyHours + (rescueMode ? missedHours : 0)) * 60) / 7));
  const windows = {
    morning: ["7:00 AM peak", "8:00 AM peak", "9:00 AM peak", "7:30 AM peak", "8:30 AM peak", "10:00 AM review", "5:00 PM reset"],
    balanced: ["10:00 AM focus", "2:00 PM focus", "11:00 AM focus", "3:00 PM focus", "12:00 PM focus", "4:00 PM review", "6:00 PM reset"],
    night: ["8:00 PM peak", "9:00 PM peak", "7:30 PM peak", "10:00 PM peak", "8:30 PM peak", "5:00 PM review", "6:00 PM reset"],
  };

  return days.map((day, index) => {
    const rescueOffset = rescueMode && index < 3 ? 0 : index;
    const item = plan[rescueOffset % Math.max(plan.length, 1)];
    const subject = item?.name || "Priority review";
    const isWeekend = day === "Sat" || day === "Sun";
    const rescuePrefix = rescueMode && index < 3 ? "Rescue block: " : "";

    return {
      day,
      subject,
      task: isWeekend ? "Timed test, error review, and next-week adjustment" : `${rescuePrefix}${item?.method || "Focused revision"} with active recall`,
      window: windows[chronotype][index],
      duration: isWeekend ? `${dailyLoad + 25} min` : `${dailyLoad} min`,
    };
  });
}

function buildRiskAlerts(subjects, weeklyHours) {
  const urgentSubjects = subjects.filter((subject) => daysUntil(subject.examDate) <= 7);
  const weakSubjects = subjects.filter((subject) => subject.confidence < 50);
  const hardSubjects = subjects.filter((subject) => subject.difficulty >= 4);
  const alerts = [];

  if (urgentSubjects.length) {
    alerts.push({
      level: "high",
      levelLabel: "High",
      title: "Exam deadline pressure",
      message: `${urgentSubjects.map((subject) => subject.name).join(", ")} need immediate revision blocks this week.`,
    });
  }

  if (weakSubjects.length) {
    alerts.push({
      level: "medium",
      levelLabel: "Medium",
      title: "Low confidence topics",
      message: `${weakSubjects.length} subject${weakSubjects.length > 1 ? "s" : ""} should use active recall before reading more notes.`,
    });
  }

  if (weeklyHours < hardSubjects.length * 4) {
    alerts.push({
      level: "medium",
      levelLabel: "Medium",
      title: "Study capacity mismatch",
      message: "Available hours may be too low for difficult subjects. Reduce passive tasks or add short morning blocks.",
    });
  }

  if (!alerts.length) {
    alerts.push({
      level: "low",
      levelLabel: "Stable",
      title: "Plan looks balanced",
      message: "No major risk detected. Keep updating confidence after every test session.",
    });
  }

  return alerts;
}

function summarizeNotes(text) {
  const clean = text.trim();
  if (!clean) return "Paste notes to generate a compact revision summary.";

  const sentences = clean
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const selected = sentences.slice(0, 3);
  const keywords = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 5)
    .slice(0, 6);

  return `${selected.join(". ")}. Key terms to revise: ${[...new Set(keywords)].join(", ") || "core concepts"}.`;
}

function generateFlashcards(text) {
  const clean = text.trim();
  if (!clean) {
    return [{ question: "What should I revise first?", answer: "Paste notes or upload a text file to generate cards." }];
  }

  const keywords = [...new Set(
    clean
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 5)
  )].slice(0, 4);

  if (!keywords.length) {
    return [{ question: "What is the main idea?", answer: clean.slice(0, 140) }];
  }

  return keywords.map((keyword) => ({
    question: `Explain ${keyword} without looking at notes.`,
    answer: `Use active recall: define it, give one example, then solve one related question.`,
  }));
}

function buildBurnDown(subjects) {
  const nearestExamDays = Math.max(1, Math.min(...subjects.map((subject) => daysUntil(subject.examDate))));
  const totalVolume = subjects.reduce((sum, subject) => sum + subject.difficulty * (100 - subject.confidence), 0) || 100;
  const width = 600;
  const height = 170;
  const startX = 20;
  const startY = 20;
  const points = Array.from({ length: 7 }, (_, index) => {
    const progress = index / 6;
    const targetRemaining = totalVolume * (1 - progress);
    const actualRemaining = totalVolume * Math.pow(1 - progress * 0.78, 1.15);
    const x = startX + progress * width;
    return {
      x,
      targetY: startY + (targetRemaining / totalVolume) * height,
      actualY: startY + (actualRemaining / totalVolume) * height,
    };
  });

  return {
    targetPoints: points.map((point) => `${point.x},${point.targetY}`).join(" "),
    actualPoints: points.map((point) => `${point.x},${point.actualY}`).join(" "),
    markers: points.map((point) => ({ x: point.x, y: point.actualY })),
    nearestExamDays,
  };
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default App;
