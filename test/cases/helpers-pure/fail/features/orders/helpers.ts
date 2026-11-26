import { database } from '@acme/database/client';

export const countOrders = (): Promise<number> => database.orderCount();
