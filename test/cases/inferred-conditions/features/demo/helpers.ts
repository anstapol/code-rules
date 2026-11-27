// Each condition below can go either way at runtime, and TypeScript accepts it.
// Biome 2.6.8 infers narrower types and reports every one as unnecessary.

const DAYS_PER_WEEK = 7;

// A counter that starts at the literal 0 is a number after += 1.
export function averages(rows: { day: number; value: number }[]): number[] {
  const days = Array.from({ length: DAYS_PER_WEEK }, () => ({ count: 0, total: 0 }));
  for (const row of rows) {
    const entry = days.at(row.day);
    if (entry) {
      entry.count += 1;
      entry.total += row.value;
    }
  }
  return days.map(({ count, total }) => (count ? total / count : 0));
}

// Optional chaining on a nullable element can be undefined.
export type Discount = { cents: number } | null;

export const totalCents = (discounts: Discount[]): number =>
  discounts.reduce((sum, discount) => sum + (discount?.cents ?? 0), 0);

// A property only some array elements set is optional.
export const highlightedLabels = (): string[] => {
  const stats = [{ highlighted: true, label: 'hours' }, { label: 'bikes' }];
  return stats.map((stat) => (stat.highlighted ? stat.label.toUpperCase() : stat.label));
};
