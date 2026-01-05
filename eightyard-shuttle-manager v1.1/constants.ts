import { DayOfWeek, Student } from './types';

export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4qCOPv5Wque4xSwMQAFaHvRZCyH_3dWbfBLTTb6BJHFkpqfJhUJnsvBj2wL_MT9UE/exec'; 

export const ADMIN_ID = 'eightyard';
export const ADMIN_PASS = 'Eightyard8!';

export const DEFAULT_CLASS_TIMES = ['2:30', '3:30', '4:30', '5:30'];

export const DAYS_OF_WEEK: DayOfWeek[] = ['월', '화', '수', '목', '금'];

export const NO_BUS = '미이용';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    name: '김지수',
    schedules: {
      '월': { classTime: '2:30', pickupBus: '1호차', dropoffBus: '1호차', pickupLocation: '현대아파트 정문', dropoffLocation: '학원 정문', pickupTime: '14:10', dropoffTime: '14:25' },
      '수': { classTime: '2:30', pickupBus: '1호차', dropoffBus: '1호차', pickupLocation: '현대아파트 정문', dropoffLocation: '학원 정문', pickupTime: '14:10', dropoffTime: '14:25' },
      '금': { classTime: '2:30', pickupBus: '1호차', dropoffBus: '1호차', pickupLocation: '현대아파트 정문', dropoffLocation: '학원 정문', pickupTime: '14:10', dropoffTime: '14:25' }
    }
  },
  {
    id: '2',
    name: '이민호',
    schedules: {
      '화': { classTime: '3:30', pickupBus: '1호차', dropoffBus: '1호차', pickupLocation: '래미안 상가', dropoffLocation: '학원 정문', pickupTime: '15:10', dropoffTime: '15:25' },
      '목': { classTime: '3:30', pickupBus: '1호차', dropoffBus: '1호차', pickupLocation: '래미안 상가', dropoffLocation: '학원 정문', pickupTime: '15:10', dropoffTime: '15:25' }
    }
  },
  {
    id: '3',
    name: '박서준',
    schedules: {
      '월': { classTime: '4:30', pickupBus: '2호차', dropoffBus: '2호차', pickupLocation: '자이 후문', dropoffLocation: '학원 정문', pickupTime: '16:05', dropoffTime: '16:25' },
      '화': { classTime: '4:30', pickupBus: '2호차', dropoffBus: '2호차', pickupLocation: '자이 후문', dropoffLocation: '학원 정문', pickupTime: '16:05', dropoffTime: '16:25' },
      '수': { classTime: '4:30', pickupBus: '2호차', dropoffBus: '2호차', pickupLocation: '자이 후문', dropoffLocation: '학원 정문', pickupTime: '16:05', dropoffTime: '16:25' },
      '목': { classTime: '4:30', pickupBus: '2호차', dropoffBus: '2호차', pickupLocation: '자이 후문', dropoffLocation: '학원 정문', pickupTime: '16:05', dropoffTime: '16:25' },
      '금': { classTime: '4:30', pickupBus: '2호차', dropoffBus: '2호차', pickupLocation: '자이 후문', dropoffLocation: '학원 정문', pickupTime: '16:05', dropoffTime: '16:25' }
    }
  }
];