CSS split created from your uploaded base.css.

Files included:
- base.css              shared public-site global styles
- home.css              homepage-only styles
- directory.css         public directory page styles
- meetings.css          meetings page + homepage mini calendar
- employment.css        employment/jobs page styles
- portal_landing.css    employee landing/portal-button styles that were mixed into base.css

Suggested link tags:

All public pages:
  <link rel="stylesheet" href="css/base.css">

Homepage:
  <link rel="stylesheet" href="css/home.css">
  <link rel="stylesheet" href="css/meetings.css">

Directory page:
  <link rel="stylesheet" href="css/directory.css">

Meetings page:
  <link rel="stylesheet" href="css/meetings.css">

Employment page:
  <link rel="stylesheet" href="css/employment.css">

Employee landing page / page with sealBar + portalNav:
  <link rel="stylesheet" href="css/portal_landing.css">

Notes:
- I kept shared cards, buttons, nav, layout, footer, accessibility, typography, and general item/list styles in base.css.
- The uploaded base.css contained portal-entry styles mixed into the public global file. I separated those into portal_landing.css.
- I did not edit your HTML files here. You will need to add/remove the appropriate <link> tags per page.
- Some pages like EMS / Public Works already have their own CSS files and should keep using them alongside base.css.
