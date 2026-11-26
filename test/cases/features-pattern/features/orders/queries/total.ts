import { readTotal } from '../server';

export const totalQuery = (id: string): Promise<number> => readTotal(id);
