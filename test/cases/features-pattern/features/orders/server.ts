import { database } from '@acme/database/client';

import { toEuros } from './helpers';

export const readTotal = async (id: string): Promise<number> => {
  const cents = await database.orderTotal(id);
  return toEuros(cents);
};
