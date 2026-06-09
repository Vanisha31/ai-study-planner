function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function daysUntil(dateValue) {
  const today = new Date();
  const exam = new Date(`${dateValue}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : 30;
}

function normalizeSubject(subject) {
  const daysLeft = Math.max(daysUntil(subject.examDate), 0);
  const difficulty = Number(subject.difficulty) || 1;
  const confidence = Number(subject.confidence) || 0;
  const topicCount = subject.syllabus
    ? subject.syllabus.split(/[,.\n]/).map((topic) => topic.trim()).filter(Boolean).length
    : 1;

  return {
    ...subject,
    daysLeft,
    difficulty,
    confidence,
    topicCount,
  };
}

export function explainSubjectPriority(subject, completedSessions = []) {
  const normalized = normalizeSubject(subject);
  const completedMinutes = completedSessions
    .filter((session) => session.subject === subject.name)
    .reduce((sum, session) => sum + session.minutes, 0);

  const urgencyScore = clamp(Math.round((21 - normalized.daysLeft) * 3.2), 0, 70);
  const difficultyScore = normalized.difficulty * 12;
  const confidenceGapScore = Math.round((100 - normalized.confidence) * 0.75);
  const syllabusLoadScore = clamp(normalized.topicCount * 4, 4, 32);
  const momentumBonus = completedMinutes ? clamp(Math.round(completedMinutes / 10), 1, 18) : 0;
  const rawScore = urgencyScore + difficultyScore + confidenceGapScore + syllabusLoadScore - momentumBonus;
  const priorityScore = clamp(rawScore, 0, 180);

  return {
    name: subject.name,
    priorityScore,
    urgencyScore,
    difficultyScore,
    confidenceGapScore,
    syllabusLoadScore,
    momentumBonus,
    daysLeft: normalized.daysLeft,
    topicCount: normalized.topicCount,
    completedMinutes,
    level: priorityScore >= 120 ? "Critical" : priorityScore >= 82 ? "High" : priorityScore >= 50 ? "Medium" : "Low",
    action:
      priorityScore >= 120
        ? "Schedule the first available deep-work block and reduce passive reading."
        : priorityScore >= 82
          ? "Use active recall today, then attempt timed questions."
          : priorityScore >= 50
            ? "Keep this topic in spaced revision."
            : "Maintain with a short review block.",
  };
}

export function buildBackendInsights(subjects, weeklyHours, missedHours, completedSessions) {
  const explanations = subjects
    .map((subject) => explainSubjectPriority(subject, completedSessions))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const totalTopics = explanations.reduce((sum, item) => sum + item.topicCount, 0) || 1;
  const completedMinutes = completedSessions.reduce((sum, session) => sum + session.minutes, 0);
  const plannedMinutes = Math.max(Number(weeklyHours) || 0, 1) * 60;
  const consistencyScore = clamp(Math.round((completedMinutes / plannedMinutes) * 100), 0, 100);
  const averageConfidence = subjects.length
    ? subjects.reduce((sum, subject) => sum + Number(subject.confidence || 0), 0) / subjects.length
    : 0;
  const urgentCount = explanations.filter((item) => item.daysLeft <= 7).length;
  const dataQuality = clamp(
    Math.round(
      45 +
        subjects.length * 7 +
        Math.min(totalTopics, 18) * 1.5 +
        (subjects.every((subject) => subject.examDate) ? 12 : 0) -
        Number(missedHours || 0) * 1.6
    ),
    30,
    100
  );
  const forecastScore = clamp(
    Math.round(averageConfidence * 0.48 + consistencyScore * 0.32 + dataQuality * 0.2 - urgentCount * 6),
    0,
    100
  );

  return {
    explanations,
    forecastScore,
    dataQuality,
    consistencyScore,
    intervention:
      forecastScore >= 75
        ? "Plan is accurate enough for normal weekly revision."
        : forecastScore >= 52
          ? "Plan needs daily updates after each focus session."
          : "Plan requires urgent recovery because deadlines, low confidence, or missed hours are creating risk.",
    backendLog: [
      "Input validation completed for subjects, exam dates, confidence, difficulty, syllabus, and focus history.",
      "Priority weights calculated for urgency, difficulty, confidence gap, syllabus load, and completed-session momentum.",
      "Readiness forecast generated from confidence, consistency, and data quality signals.",
    ],
  };
}
