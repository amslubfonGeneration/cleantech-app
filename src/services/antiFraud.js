export function checkDepositConsistency({ weight, recentDeposits }) {
  if (weight <= 0 || weight > 500) return { ok: false, reason: 'Poids invalide' };
  const tooFrequent = recentDeposits.filter(d => (Date.now()/1000 - d.created_at) < 10 * 60).length > 5;
  if (tooFrequent) return { ok: false, reason: 'Dépôts trop fréquents' };
  return { ok: true };
}
