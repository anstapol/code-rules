import { CENTS_PER_EURO } from './constants';

export const toEuros = (cents: number): number => cents / CENTS_PER_EURO;
