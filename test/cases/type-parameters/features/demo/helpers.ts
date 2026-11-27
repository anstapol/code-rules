export const firstOf = <TData>(items: TData[]): TData | undefined => items.at(0);

export const pick = <TRecord extends object, K extends keyof TRecord>(
  record: TRecord,
  key: K
): TRecord[K] => record[key];

// A PascalCase name that starts with T is not a T prefix.
export type Attrs<Type extends string> = { [Key in Type]: { type: Key } }[Type];

export const ofTarget = <Target extends object>(target: Target): Target => target;
