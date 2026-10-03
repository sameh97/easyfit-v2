import { GroupTraining } from 'src/app/model/group-training';
import { Trainer } from 'src/app/model/trainer';
import { startOfDay } from '../members-components/member-status';

/** A trainer's group trainings, split around now (§5.3). */
export interface TrainerSchedule {
  /** Classes in the current week (Sunday to Saturday, as in Israel). */
  thisWeek: number;
  /** Soonest first. */
  upcoming: GroupTraining[];
  /** Newest first. */
  past: GroupTraining[];
}

export const EMPTY_SCHEDULE: TrainerSchedule = { thisWeek: 0, upcoming: [], past: [] };

export function schedulesByTrainer(trainings: GroupTraining[], now: Date = new Date()): Map<number, TrainerSchedule> {
  const weekStart: Date = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd: Date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);

  const byTrainer = new Map<number, TrainerSchedule>();
  const sorted: GroupTraining[] = [...trainings].sort(
    (a: GroupTraining, b: GroupTraining) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  for (const training of sorted) {
    const schedule: TrainerSchedule = byTrainer.get(training.trainerId) ?? { thisWeek: 0, upcoming: [], past: [] };
    const start: number = new Date(training.startTime).getTime();
    if (start >= weekStart.getTime() && start < weekEnd.getTime()) {
      schedule.thisWeek++;
    }
    if (start >= now.getTime()) {
      schedule.upcoming.push(training);
    } else {
      schedule.past.unshift(training);
    }
    byTrainer.set(training.trainerId, schedule);
  }
  return byTrainer;
}

export function trainerStatus(trainer: Trainer): 'active' | 'inactive' {
  return trainer.isActive ? 'active' : 'inactive';
}
