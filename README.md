# MindMend

A first-cut mobile wellbeing prototype for Students and Working Professionals, with a calm rose and lilac identity.

## Open the product

Open `index.html` in a modern browser. No install or build step is needed. For a local server, run `python3 -m http.server 8791` from this folder and visit `http://localhost:8791`.

The splash leads to onboarding for a new visit and to Today for users who choose to remember their entries. It can be skipped immediately.

## Included experiences

- Student and Working Professional contexts adapt situations, recommendations, journal prompts and illustrative insights.
- Today, optional three-step check-in and contextual recommendations.
- Quick Reset with a breathing timer, pause/resume and grounding alternative.
- Searchable Toolkit with guided activity steps.
- Focus sessions with preset/custom durations, task selection, progress, pause/resume and reflection.
- Insights with clearly labelled fictional examples and a separate history of actual check-ins.
- Journal with prompts, retained drafts, saving and deleting reflections.
- Support, Profile, preferences, data export/delete and accessibility settings.
- Animated opening, page transitions, completion feedback, reduced motion and larger reading text.
- In-app and browser Back/Forward follow the visited screens, retaining scroll, drafts and activity progress. Restored timers remain paused until resumed.

## Privacy and prototype boundaries

By default, check-ins and reflections are held in memory for the current visit. Remembering entries on this device is optional. Saved entries use browser storage; the prototype does not encrypt them or provide an app lock. Use sample reflections, especially on a shared device.

The app has no account, tracking script, entry upload, employer dashboard, university dashboard or wellbeing score. It is a wellbeing concept rather than a clinical or emergency service. The Support screen links to an external help directory when you choose to open it.

Insights examples are fictional. Recommendations use simple demonstration rules; this is not a production pattern engine or a clinical assessment.

## Checks

Run `npm test`, or `node verify.cjs` directly. No dependencies are required.

Automated checks cover 31 states in both modes, splash lifecycle, actual-origin Back/Forward, retained scroll/drafts/filters/activity progress, saved-data integrity, deletion, and timer restoration/resume/completion.

The latest splash/motion and navigation changes pass these checks. Visual verification of those changes remains pending because the preview browser's admin access check was unavailable.

## Preview paths

- `index.html` — normal launch.
- `index.html?screen=today` — Student Today.
- `index.html?screen=today&mode=work` — Working Professional Today.
- `index.html?screen=splash&hold=1` — hold the splash for presentation.
- `index.html?screen=recommendation&sample=1` — explicit sample check-in for design review.

See `MOTION-NOTES.md` for motion details. The product source is independent of the portfolio.
