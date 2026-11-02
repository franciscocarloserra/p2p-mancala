// Kalah rules for n players. Seat q owns pits q*7 .. q*7+5 and its store q*7+6; sowing goes around all of them.
export const store = q => q * 7 + 6;
// capture victim: the player halfway around. 2 players: the pit in front (mirrored board); 3+: same column, since rows line up
export const prey = (n, q) => (q + (n >> 1)) % n;
export const across = (n, q, i) => prey(n, q) * 7 + (n === 2 ? 5 - i : i);

// Plays pit i for seat p; returns an error string or undefined
export function sow(s, p, i) {
  if (s.phase !== 'play') return 'not started';
  if (s.turn !== p) return 'not your turn';
  const n = s.players.length;
  let k = p * 7 + i, c = s.pits[k];
  if (!c) return 'empty pit';
  s.pits[k] = 0; const hit = [k];
  while (c) { k = (k + 1) % (7 * n); if (k % 7 === 6 && k !== store(p)) continue; s.pits[k]++; c--; hit.push(k); }
  const tgt = across(n, p, k % 7);
  s.eat = -1;
  if (Math.floor(k / 7) === p && k % 7 < 6 && s.pits[k] === 1 && s.pits[tgt]) {
    s.eat = tgt; s.ate = s.pits[tgt];
    s.pits[store(p)] += s.pits[tgt] + 1; s.pits[k] = s.pits[tgt] = 0; hit.push(tgt, store(p));
  }
  s.extra = k === store(p);
  if (!s.extra) s.turn = (p + 1) % n;
  const side = q => s.pits.slice(q * 7, q * 7 + 6);
  if (s.players.some((_, q) => side(q).every(x => !x))) {
    for (let q = 0; q < n; q++) for (let j = 0; j < 6; j++) { s.pits[store(q)] += s.pits[q * 7 + j]; s.pits[q * 7 + j] = 0; }
    s.phase = 'over';
  }
  s.last = hit;
}
