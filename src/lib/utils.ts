export function formatScore(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPopulation(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("nl-NL").format(value);
}
