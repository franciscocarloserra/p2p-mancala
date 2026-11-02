# p2p-mancala

**Play: https://franciscocarloserra.github.io/p2p-mancala/**

![board](screenshot.png)

Mancala (Kalah, 6 pits x 4 stones) for 2 to 10 players, browser to browser over WebRTC via Trystero/Nostr. No server.

Open `index.html` (or the GitHub Pages site): it generates a `#room:password` link; send the whole link to your opponent. Whoever opens the room picks how many players (default 2); the game starts by itself once that many have opened the link, later arrivals watch. With 3+ players each row is a player, P1 on top: stones go left to right and down to the next row (the last row feeds P1), turns go top to bottom, captures take the same column from the player halfway around the table, and hovering a pit (on a phone: first tap, second tap plays) previews where it lands and what it captures. "xl" or Esc toggles a spreadsheet look.

"vs bot" switches to a local game against the bot (`#bot`), with a level picker: easy, normal, hard, expert, champion. It's one alpha-beta search (`bot.js`); lower levels search shallower and sometimes play a random move. `node selfplay.js [openings]` plays each level against the next one up; each step wins about 75-80% of games.

The game is saved on each device (localStorage) and re-syncs on reconnect. To publish a new version, bump the version in `index.html` (`VERSION` and every `?v=` import) and in `version.txt`.

Limitations: no TURN server, so some strict networks won't connect. No referee: each client trusts the state the other sends. To test on one machine, open the second player in a private window (identity lives in localStorage).
