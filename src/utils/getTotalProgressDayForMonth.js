import { Timestamp } from "firebase/firestore";
import { isHabitPausedOnDay } from "./habitUtils.js";

function getDayOfWeek(date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];  // getDay() returns 0 for Sunday, 6 for Saturday
}

// Add pauses parameter
export function getTotalProgressDayForMonth(day, progressArray, habits, pauses = []) {
  // Ensure we're working with Date objects
  const targetDate = new Date(day);
  const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  const dayProgress = progressArray.filter(habit => {
    if (!habit.timestamp) return false;

    let habitDate;
    if (habit.timestamp instanceof Timestamp) {
      habitDate = habit.timestamp.toDate();
    } else if (habit.timestamp.seconds) {
      habitDate = new Timestamp(habit.timestamp.seconds, habit.timestamp.nanoseconds).toDate();
    } else {
      habitDate = new Date(habit.timestamp);
    }

    return habitDate >= dayStart && habitDate <= dayEnd;
  });

  const combinedDayHabits = habits.map(habit => {
    const progressEntry = dayProgress.find(weekHabit => weekHabit.habitId === habit.habitId);
    return {
      ...habit,
      progress: progressEntry ? progressEntry.progress : 0,
      progressId: progressEntry ? progressEntry.progressId : '',
      timestamp: progressEntry ? progressEntry.timestamp : null,
    };
  });

  const dayOfWeek = getDayOfWeek(targetDate);

  // Filter habits based on day of week and term dates
  const filteredHabits = combinedDayHabits.filter(habit => {
    if (!habit.repeat || !habit.repeat[dayOfWeek]) return false;

    const termStart = habit.termStart instanceof Timestamp
      ? habit.termStart.toDate()
      : new Timestamp(habit.termStart.seconds, habit.termStart.nanoseconds).toDate();

    const termStartDay = new Date(termStart.getFullYear(), termStart.getMonth(), termStart.getDate(), 0, 0, 0, 0);

    if (termStartDay > dayEnd) return false;

    if (habit.termEnd === null) return true;

    const termEnd = habit.termEnd instanceof Timestamp
      ? habit.termEnd.toDate()
      : new Timestamp(habit.termEnd.seconds, habit.termEnd.nanoseconds).toDate();

    const termEndDay = new Date(termEnd.getFullYear(), termEnd.getMonth(), termEnd.getDate(), 23, 59, 59, 999);

    return termEndDay >= dayStart;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const notPausedHabits = filteredHabits.filter(habit => !isHabitPausedOnDay(habit.habitId, targetDate, pauses));

  let progress = 0;
  let totalDailyGoal = 0;

  notPausedHabits.forEach(habit => {
    if (habit.timestamp) {
      const habitDate = habit.timestamp instanceof Timestamp
        ? habit.timestamp.toDate()
        : new Timestamp(habit.timestamp.seconds, habit.timestamp.nanoseconds).toDate();

      if (habitDate >= dayStart && habitDate <= dayEnd) {
        progress += Number(habit.progress);
      }
    }
    totalDailyGoal += habit.dailyGoal;
  });

  const totalProgress = totalDailyGoal > 0 ? (progress / totalDailyGoal) * 100 : 0;

  return { totalProgress, endHabits: notPausedHabits };
}