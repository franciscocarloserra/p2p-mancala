# p2p-mancala

Two-player Mancala (Kalah, 6 pits x 4 stones), browser to browser over WebRTC via Trystero/Nostr. No server.

Live: https://franciscocarloserra.github.io/p2p-mancala/

Open `index.html` (or the GitHub Pages site): it generates a `#room:password` link; send the whole link to your opponent. A third person with the link can watch. "xl" or Esc toggles a spreadsheet look.

The game is saved on each device (localStorage) and re-syncs on reconnect. To publish a new version, bump the version in `index.html` (`VERSION` and the `?v=` import) and in `version.txt`.

Limitations: no TURN server, so some strict networks won't connect. No referee: each client trusts the state the other sends. To test on one machine, open the second player in a private window (identity lives in localStorage).
