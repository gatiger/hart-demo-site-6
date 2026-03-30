JS split created from your uploaded app.js.

Files included:
- app.js (public global only)
- directory.js
- news.js
- meetings.js
- home.js
- commissioners.js

Suggested script tags:

All public pages:
  <script src="js/app.js" defer></script>

Homepage:
  <script src="js/home.js" defer></script>
  <script src="js/meetings.js" defer></script>

Directory page:
  <script src="js/directory.js" defer></script>

News page:
  <script src="js/news.js" defer></script>

Meetings page:
  <script src="js/meetings.js" defer></script>

Commissioners page:
  <script src="js/commissioners.js" defer></script>

Notes:
- I kept alerts on home.js because they appear homepage-specific in your current structure.
- meetings.js includes both the homepage mini-calendar and the full meetings page logic.
- app.js is now only shared/global public-site code.
