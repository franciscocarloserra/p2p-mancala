// 2-player Kalah bot: alpha-beta search on the 14-pit array from game.js (pits 0-5 + store 6 for seat 0, 7-12 + store 13 for seat 1).
// One engine, nerfed per level: shallower search and a chance of playing a random legal move.
export const LEVELS = {
  easy:     {depth: 1, err: 0.4},
  normal:   {depth: 2, err: 0.2},
  hard:     {depth: 4, err: 0.07},
  expert:   {depth: 8, err: 0},
  champion: {depth: 60, err: 0, ms: 400},  // iterative deepening until ms runs out or the search reaches every game end
};
const WIN = 1000;    // added to a finished game's margin so any win beats any lead in an unfinished one
const CHECK = 2047;  // nodes between clock checks (mask)
const STOP = {};

// Sows seat p's pit i in place. Returns 2 if the game ended (sides already swept), 1 if p moves again, else 0.
export function apply(b, p, i) {
  const own = p * 7 + 6, opp = own === 6 ? 13 : 6;
  let k = p * 7 + i, c = b[k]; b[k] = 0;
  while (c) { k = k === 13 ? 0 : k + 1; if (k !== opp) { b[k]++; c--; } }
  if (k >= p * 7 && k < own && b[k] === 1 && b[12 - k]) { b[own] += b[12 - k] + 1; b[k] = b[12 - k] = 0; }
  let a = 0, z = 0;
  for (let j = 0; j < 6; j++) { a += b[j]; z += b[7 + j]; }
  if (!a || !z) { b[6] += a; b[13] += z; for (let j = 0; j < 6; j++) b[j] = b[7 + j] = 0; return 2; }
  return k === own ? 1 : 0;
}

let nodes, deadline, cut;
// moves that land in our store first (they keep the turn), then right to left
const order = (b, p) => [5, 4, 3, 2, 1, 0].filter(i => b[p * 7 + i]).sort((x, y) => (b[p * 7 + y] === 6 - y) - (b[p * 7 + x] === 6 - x));
const margin = (b, p) => p ? b[13] - b[6] : b[6] - b[13];

function nega(b, p, d, alpha, beta) {
  if (!(++nodes & CHECK) && deadline && Date.now() > deadline) throw STOP;
  if (!d) { cut = true; return margin(b, p); }
  let best = -Infinity;
  for (const i of order(b, p)) {
    const c = b.slice(), r = apply(c, p, i);
    let v;
    if (r === 2) { v = margin(c, p); v += Math.sign(v) * WIN; }
    else v = r ? nega(c, p, d - 1, alpha, beta) : -nega(c, 1 - p, d - 1, -beta, -alpha);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

// Best pit (0-5) for seat p at this level; rng only matters for err
export function botMove(pits, p, lv = LEVELS.champion, rng = Math.random) {
  const b = pits.slice(), legal = order(b, p);
  if (legal.length === 1) return legal[0];
  if (rng() < lv.err) return legal[Math.floor(rng() * legal.length)];
  nodes = 0; deadline = lv.ms ? Date.now() + lv.ms : 0;
  let move = legal[0];
  for (let d = 1; d <= lv.depth; d++) {
    cut = false;
    try {
      let alpha = -Infinity, bm = move;
      for (const i of [move, ...legal.filter(x => x !== move)]) { // previous best first
        const c = b.slice(), r = apply(c, p, i);
        let v;
        if (r === 2) { v = margin(c, p); v += Math.sign(v) * WIN; }
        else v = r ? nega(c, p, d - 1, alpha, Infinity) : -nega(c, 1 - p, d - 1, -Infinity, -alpha);
        if (v > alpha) { alpha = v; bm = i; }
      }
      move = bm;
    } catch (e) { if (e !== STOP) throw e; break; }
    if (!cut) break; // every line reached a game end: the answer is exact
  }
  return move;
}
