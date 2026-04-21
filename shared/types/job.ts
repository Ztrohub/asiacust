export interface IJob {
    _id: string;
    customer: string;
    description: string;
    workerDescription: string | null;
    scheduleDate: Date | null;
    startDate: Date | null;
    endDate: Date | null;
    price: number,
    status: JOB_STATUS;
    paymentDate: Date | null;
    paymentStatus: PAYMENT_STATUS;
    workers: string[];
}

export enum JOB_STATUS {
    UNSCHEDULED = 'unscheduled',
    SCHEDULED = 'scheduled',
    DONE= 'done',
    CANCELLED= 'cancelled'
}

export enum PAYMENT_STATUS {
    UNPAID = 'unpaid',
    CASH = 'cash',
    TRANSFER = 'transfer'
}