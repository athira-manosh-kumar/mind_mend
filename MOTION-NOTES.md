# MindMend opening and motion

Updated 8 October 2026.

- Fresh launch opens an original four-petal mark, draws its M monogram, then reveals the wordmark and tagline. It advances to Welcome after 2.8 seconds. The Enter your space button skips the sequence immediately.
- Users who have opted into device storage land on Today after the opening. Direct screen links keep their selected screen and context.
- Forward navigation has a brief rise and fade. Back navigation has a subtle horizontal return. Option selection retains keyboard focus and does not replay the page entrance.
- Check-in and reset completion use a soft bloom and drawn tick. Selected chips have a small response. Breathing petals resume at the elapsed breath phase when paused and resumed. Focus progress remains tied to its timer.
- Reduced motion disables visual movement and keeps the content visible. The opening advances after 0.9 seconds in reduced-motion mode. Skip is always available.

## Review

Open index.html to see the launch. Use index.html?screen=splash&hold=1 to keep the splash on screen for presentation. Use index.html?screen=today or index.html?screen=today&mode=work for direct Student or Working Professional previews.

exports/splash.svg is a static design export drawn from the splash composition. Earlier PNG exports reflect the prior UI refinement; the animated product source is authoritative for the current interactions.

The product and case study remain separate. No portfolio navigation is added.

## Back navigation update

Back follows the actual entry route rather than a screen’s default parent. For example, Today → Journal → Back returns to Today, while Profile → Journal → Back returns to Profile. Preferences Done also returns to its entry screen. Browser Back and Forward use the same visited-screen history.

Returning restores the page’s scroll position and guided activity step, retains unsaved writing, and pauses timer screens until Resume is selected. The active focus duration and task remain the same even when Focus settings change. Splash is replaced by Welcome/Today so Back cannot reopen the timed introduction. Deep links with no previous in-app visit use a sensible fallback.

Revisiting a completed check-in updates that check-in rather than adding a duplicate. Saved reflections return to Journal without restoring the saved form. Entries and preferences are not rolled back by history. Demo sample feelings require an explicit sample=1 query; a route reload does not invent a previous check-in.
