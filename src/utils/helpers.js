export function pointsForDeposit({ type, weight }) {
  const base = { plastique: 2, verre: 1, metal: 3, electronique: 5 }[type] || 1;
  return Math.round(base * weight);
}
