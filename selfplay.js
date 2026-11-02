// Bot vs bot arena. Each opening (OPEN_PLIES random moves) is played twice with seats swapped, so the opening cancels out.
// node selfplay.js [openings=100] [levelA,levelB ...]   default pairs: each level vs the next one up
// Runs on all cores; also checks bot.js's fast move against game.js's sow on every move.
import {Worker, isMainThread, workerData, parentPort} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';
import {cpus} from 'node:os';
import {sow} from './game.js';
import {botMove, apply, LEVELS} from './bot.js';

const OPEN_PLIES = 4;
const STONES = 4;
const mulberry = a => () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 2 ** 32; };

// returns margin for the bot in seat 0
function game(seed, lv) {
  const rng = mulberry(seed), s = {phase: 'play', turn: 0, players: [0, 1], pits: Array.from({length: 14}, (_, k) => k % 7 === 6 ? 0 : STONES)};
  for (let ply = 0; s.phase === 'play'; ply++) {
    const p = s.turn, legal = [0, 1, 2, 3, 4, 5].filter(i => s.pits[p * 7 + i]);
    const i = ply < OPEN_PLIES ? legal[Math.floor(rng() * legal.length)] : botMove(s.pits, p, LEVELS[lv[p]], rng);
    const b = s.pits.slice(), r = apply(b, p, i);
    if (sow(s, p, i)) throw new Error('illegal move');
    if (b.join() !== s.pits.join() || (r === 2) !== (s.phase === 'over') || (s.phase === 'play' && (r === 1) !== s.extra)) throw new Error('bot.js and game.js disagree');
  }
  return s.pits[6] - s.pits[13];
}

function run({from, to, a, b}) {
  let w = 0, l = 0, m = 0, ms = 0;
  for (let k = from; k < to; k++) for (const sw of [0, 1]) {
    const t = Date.now(), d = game(k + 1, sw ? [b, a] : [a, b]) * (sw ? -1 : 1);
    ms += Date.now() - t; m += d; if (d > 0) w++; else if (d < 0) l++;
  }
  return {w, l, m, ms};
}

if (!isMainThread) parentPort.postMessage(run(workerData));
else {
  const n = +(process.argv[2] ?? 100), names = Object.keys(LEVELS), cores = cpus().length, file = fileURLToPath(import.meta.url);
  const pairs = process.argv.length > 3 ? process.argv.slice(3).map(x => x.split(',')) : names.slice(0, -1).map((x, i) => [x, names[i + 1]]);
  for (const [a, b] of pairs) {
    const per = Math.ceil(n / cores), parts = await Promise.all(Array.from({length: cores}, (_, c) => new Promise((ok, ko) => {
      const wk = new Worker(file, {workerData: {from: c * per, to: Math.min(n, (c + 1) * per), a, b}});
      wk.once('message', ok); wk.once('error', ko);
    })));
    const t = parts.reduce((x, y) => ({w: x.w + y.w, l: x.l + y.l, m: x.m + y.m, ms: x.ms + y.ms}));
    console.log(`${a} vs ${b}: ${a} wins ${(100 * t.w / (2 * n)).toFixed(0)}%, loses ${(100 * t.l / (2 * n)).toFixed(0)}%, margin ${(t.m / (2 * n)).toFixed(1)}, ${(t.ms / (2 * n) / 1000).toFixed(1)}s/game`);
  }
}
