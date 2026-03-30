# Portal Refactor Notes

Public site globals remain:
- css/base.css
- js/app.js

Portal globals now live at:
- css/portal_base.css
- js/portal_app.js

Portal pages:
- /portal/portal_resources.html
- /portal/portal_directory.html

Portal page-specific files:
- css/portal_directory.css
- js/portal_directory.js
- js/portal_resources.js

Legacy employee page URLs at the site root now redirect to the new portal URLs.

Archived backup files were moved into:
- /archive/css
- /archive/js
