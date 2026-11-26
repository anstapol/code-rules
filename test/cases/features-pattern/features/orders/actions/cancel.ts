import { database } from '@acme/database/client';

export const cancelOrder = async (id: string): Promise<void> => {
  await database.cancelOrder(id);
};
