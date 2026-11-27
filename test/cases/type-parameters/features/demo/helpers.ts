export const firstOf = <TData>(items: TData[]): TData | undefined => items.at(0);

export const pick = <TRecord extends object, K extends keyof TRecord>(
  record: TRecord,
  key: K
): TRecord[K] => record[key];
