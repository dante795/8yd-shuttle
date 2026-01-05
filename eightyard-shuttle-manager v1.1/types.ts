export type DayOfWeek = '월' | '화' | '수' | '목' | '금';

export interface DailySchedule {
  classTime: string;
  pickupBus: string; // e.g. '1호차'
  dropoffBus: string; // e.g. '1호차'
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;
}

export interface Student {
  id: string;
  name: string;
  // busId removed, moved to DailySchedule as pickupBus/dropoffBus
  schedules: Partial<Record<DayOfWeek, DailySchedule>>;
}

export interface ClassSchedule {
  time: string;
  students: Student[];
}

export type SortOrder = 'asc' | 'desc';
