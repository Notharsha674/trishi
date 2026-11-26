# Trishi's birthday website — by Ash

Animated Shinchan-themed birthday website with **three original gifts** plus a separate interactive **Fun Zone**.

## Live website
https://notharsha674.github.io/trishi/

## Original birthday flow
Welcome → Shinchan reaction → gift selection → birthday card/cake, 10 photos, long Hinglish note → final greeting.

## New interactive Fun Zone
The **FUN ZONE** button is on the gift screen, and the Menu provides quick access.

### Games

### Six additional playable mini-games (v10)
- **Tic-Tac-Toe:** play X against a computer with win/block logic and a round scoreboard
- **Rock Paper Scissors:** play against the computer; wins, losses and ties
- **Reaction Speed:** wait for green then tap; records fastest time locally
- **Catch the Cake:** catch a moving cake in a 3×3 grid for 20 seconds; local high score
- **Guess the Number:** higher/lower hints, 1–50, seven attempts
- **Word Scramble:** 12 shuffled words, hints, skips, scoring and replay

The original Memory Match, Tap Challenge, and This or That brought the total to nine playable games. Choose a game using the picker on the Games tab. Use the visible **🎮 Games** button at the top-left, or **🎮 PLAY MINI GAMES** on the gifts screen. The old nonfunctional video-reference footer text was removed.
- Memory Match: six pairs of cards, shuffle and move counter
- Ten-second Tap Game: target moves every tap, timer, local personal best
- This or That: eight rounds of rapid choices

### Random
- Friendly roast roulette
- Hype generator
- Funny fictional fortune cookies
- Would You Rather: eight repeatable dilemmas

### Photos
- Photo slideshow: previous, next, random, autoplay and stop
- Link back to original hanging polaroid photo gallery and zoom

### Extras
- Scratch card, with a touch/mouse interaction and accessible reveal button
- Choose the birthday plan
- Website star rating (saved locally on this browser, not collected)
- Note to yourself (saved in this browser; never sent to Ash)
- Song seek bar (existing play/pause and volume remain available)
- Copy website link
- Confetti trigger

Additional Easter egg: click/tap Shinchan five times. Keyboard shortcut: **?** opens the Fun Zone. Existing Escape navigation is preserved.

## Running locally
Keep `index.html`, `style.css`, `script.js`, `funzone.css`, `funzone.js`, and `assets/` in the same relative positions. Open `index.html` in a browser.

## GitHub Pages
Select `main` + `/ (root)` in Settings → Pages.

## Notes
- The music was already present in this repository. Browser autoplay with sound may require the visitor's first click.
- Never publish photos or recordings without permission. Public GitHub Pages makes assets accessible to visitors.
- A local rating or note is not shared to the website owner. This is a static site with no backend.
- If a change looks stale, do a hard refresh (Ctrl + Shift + R).

## Optional private response dashboard + email alerts (setup required)

A new opt-in form lets visitors choose **only** their This-or-That / Would-You-Rather answers, completed game scores, and optional site rating, inspect a preview, then press Send with explicit consent and a private invite code. No automatic transmission, no personal note sharing.

Ash's authenticated dashboard page: https://notharsha674.github.io/trishi/ash-dashboard.html

**Not connected yet.** The frontend, owner-only database SQL, backend Edge Function and email integration source are committed, but need a personal Supabase project, Resend credentials, the owner's Auth UUID, and a shared private invitation code. See [SETUP-PRIVATE-DASHBOARD.md](SETUP-PRIVATE-DASHBOARD.md). Never commit any private credentials.

## Extra arcade games — v12

Five new fully local, replayable mini-games are in the Games tab:

- **2048:** Number merge with keyboard arrows, on-screen directions and touch swipes; local high score
- **Sequence Recall:** Repeat expanding colour sequences; records the longest completed sequence
- **Typing Sprint:** 30 seconds of typing with WPM, accuracy and a personal best
- **Math Dash:** Ten multiple-choice addition, subtraction and multiplication questions
- **Emoji Decode:** Ten emoji-to-phrase puzzles, shuffled options and a score

This brings the visible game picker to **14 choices**. There's also a **Local Arcade Records** panel showing personal bests stored in the visitor's browser. No scores or typing text are uploaded automatically. The separate opt-in sharing screen can include results from the five new games only after the visitor explicitly selects game scores and sends them. The private Supabase response collection still stays disabled until the owner and invite-code settings are finished.
