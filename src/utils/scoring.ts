import type {
  CategoryAverage,
  DailyScore,
  DashboardSummary,
  MetricAverages,
  MetricKey,
  Question,
  ScoreRecord,
  WeakQuestion,
} from '../types';

const metricLabels: Record<MetricKey, string> = {
  listening: 'Listening',
  responseSpeed: 'Response speed',
  practicalSafety: 'Practical safety',
  naturalness: 'Naturalness',
};

export function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildDashboard(records: ScoreRecord[], questions: Question[]): DashboardSummary {
  const dailyScores = buildDailyScores(records);
  const today = toDateKey(new Date());
  const todayAverage = average(records.filter((record) => toDateKey(record.timestamp) === today).map((record) => record.totalScore));
  const categoryAverages = buildCategoryAverages(records);
  const metricAverages = buildMetricAverages(records);
  const knownQuestionIds = new Set(questions.map((question) => question.id));
  const answeredQuestionIds = new Set(
    records
      .map((record) => record.questionId)
      .filter((questionId) => knownQuestionIds.size === 0 || knownQuestionIds.has(questionId)),
  );
  const firstThreeDayAverage = average(dailyScores.slice(0, 3).map((day) => day.averageTotal));
  const latestThreeDayAverage = average(dailyScores.slice(-3).map((day) => day.averageTotal));
  const improvementPercentage =
    firstThreeDayAverage > 0 ? ((latestThreeDayAverage - firstThreeDayAverage) / firstThreeDayAverage) * 100 : 0;

  return {
    todayAverage,
    totalAnswered: answeredQuestionIds.size,
    totalPracticeSessions: countPracticeSessions(records),
    averageTotalScore: average(records.map((record) => record.totalScore)),
    metricAverages,
    categoryAverages,
    dailyScores,
    sevenDayMovingAverage: buildSevenDayMovingAverage(dailyScores),
    firstThreeDayAverage,
    latestThreeDayAverage,
    improvementPercentage,
    weakestMetric: findWeakestMetric(metricAverages, records.length),
    currentStreak: calculateCurrentStreak(records),
    lastPracticeDate: records.length > 0 ? toDateKey(records[records.length - 1].timestamp) : '',
  };
}

export function getWeakQuestions(records: ScoreRecord[], questions: Question[]): WeakQuestion[] {
  const byQuestion = new Map<string, ScoreRecord[]>();
  records.forEach((record) => {
    byQuestion.set(record.questionId, [...(byQuestion.get(record.questionId) ?? []), record]);
  });

  return questions
    .map((question) => {
      const questionRecords = byQuestion.get(question.id) ?? [];
      const metricAverages = buildMetricAverages(questionRecords);
      const averageTotal = average(questionRecords.map((record) => record.totalScore));
      const weakestMetric = findWeakestMetric(metricAverages, questionRecords.length);
      const lastPracticed =
        questionRecords.length > 0
          ? questionRecords.map((record) => record.timestamp).sort((left, right) => right.localeCompare(left))[0]
          : '';
      const weakByTotal = questionRecords.length > 0 && averageTotal < 5;
      const weakMetric = weakestMetric !== 'none' && metricAverages[weakestMetric] < 1;

      if (!weakByTotal && !weakMetric) {
        return null;
      }

      const reason = weakMetric
        ? `Average ${metricLabels[weakestMetric]} score is below 1.0`
        : 'Average total score is below 5.0';

      return {
        question,
        averageTotal,
        metricAverages,
        weakestMetric: weakestMetric === 'none' ? 'practicalSafety' : weakestMetric,
        lastPracticed,
        reason,
      } satisfies WeakQuestion;
    })
    .filter((item): item is WeakQuestion => Boolean(item))
    .sort((left, right) => {
      if (left.averageTotal !== right.averageTotal) {
        return left.averageTotal - right.averageTotal;
      }
      if (left.metricAverages.listening !== right.metricAverages.listening) {
        return left.metricAverages.listening - right.metricAverages.listening;
      }
      if (left.metricAverages.responseSpeed !== right.metricAverages.responseSpeed) {
        return left.metricAverages.responseSpeed - right.metricAverages.responseSpeed;
      }
      return left.lastPracticed.localeCompare(right.lastPracticed);
    });
}

export function buildMetricAverages(records: ScoreRecord[]): MetricAverages {
  return {
    listening: average(records.map((record) => record.listeningScore)),
    responseSpeed: average(records.map((record) => record.responseSpeedScore)),
    practicalSafety: average(records.map((record) => record.practicalSafetyScore)),
    naturalness: average(records.map((record) => record.naturalnessScore)),
  };
}

function buildCategoryAverages(records: ScoreRecord[]): CategoryAverage[] {
  const categories = new Map<string, ScoreRecord[]>();
  records.forEach((record) => {
    categories.set(record.category, [...(categories.get(record.category) ?? []), record]);
  });

  return Array.from(categories.entries())
    .map(([category, categoryRecords]) => ({
      category,
      average: average(categoryRecords.map((record) => record.totalScore)),
      count: categoryRecords.length,
    }))
    .sort((left, right) => right.count - left.count);
}

function buildDailyScores(records: ScoreRecord[]): DailyScore[] {
  const days = new Map<string, ScoreRecord[]>();
  records.forEach((record) => {
    const date = toDateKey(record.timestamp);
    days.set(date, [...(days.get(date) ?? []), record]);
  });

  return Array.from(days.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayRecords]) => {
      const metrics = buildMetricAverages(dayRecords);
      return {
        date,
        averageTotal: average(dayRecords.map((record) => record.totalScore)),
        listening: metrics.listening,
        responseSpeed: metrics.responseSpeed,
        practicalSafety: metrics.practicalSafety,
        naturalness: metrics.naturalness,
        count: dayRecords.length,
      };
    });
}

function buildSevenDayMovingAverage(days: DailyScore[]): DailyScore[] {
  return days.map((day, index) => {
    const window = days.slice(Math.max(0, index - 6), index + 1);
    return {
      ...day,
      averageTotal: average(window.map((item) => item.averageTotal)),
      listening: average(window.map((item) => item.listening)),
      responseSpeed: average(window.map((item) => item.responseSpeed)),
      practicalSafety: average(window.map((item) => item.practicalSafety)),
      naturalness: average(window.map((item) => item.naturalness)),
      count: window.reduce((sum, item) => sum + item.count, 0),
    };
  });
}

function findWeakestMetric(metricAverages: MetricAverages, recordCount: number): MetricKey | 'none' {
  if (recordCount === 0) {
    return 'none';
  }

  return (Object.entries(metricAverages) as [MetricKey, number][]).sort((left, right) => left[1] - right[1])[0][0];
}

function countPracticeSessions(records: ScoreRecord[]) {
  return new Set(records.map((record) => toDateKey(record.timestamp))).size;
}

function calculateCurrentStreak(records: ScoreRecord[]) {
  const practiceDays = Array.from(new Set(records.map((record) => toDateKey(record.timestamp)))).sort((left, right) =>
    right.localeCompare(left),
  );
  if (practiceDays.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(`${practiceDays[0]}T00:00:00`);
  for (const day of practiceDays) {
    if (day !== toDateKey(cursor)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toDateKey(date: Date | string) {
  const value = typeof date === 'string' ? new Date(date) : date;
  return value.toISOString().slice(0, 10);
}
