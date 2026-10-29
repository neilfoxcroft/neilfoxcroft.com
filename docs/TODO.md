# TODO

Open work on neilfoxcroft.com. Content lives in `src/data/resume.json` unless noted.

## Content to write (Neil)

- [ ] **Education detail panes**: flesh out the text shown when an education card is clicked (`education[].summary`, plus optional `activities`).
  - [x] BSc Information Technology: RAG Technical Committee and residence activities (2026-10-29).
  - [ ] BSc Honours could say more than the current one-liner (thesis, modules, highlights).
- [ ] **Homelab write-up** project: replace the `[Homelab write-up]` placeholder in `projects` (the self-hosted stack, the hardware, how it's deployed and managed).
- [ ] **Public backend project**: replace the `[Public backend project]` placeholder in `projects` (a small Spring Boot or Kotlin service with Terraform).
- [ ] **PCT extras** in `pct`:
  - days on trail and pairs of shoes (currently `[__]`)
  - the intro story (bracketed text in `pct.intro`)
  - trail journal link (`pct.journal`; it becomes a real link once it has a URL)
  - three photos: desert, Sierra, Cascades

## Features to consider

- [ ] **Get in touch / contact**: a contact section on the page, or its own page. Today there's only the email icon in the header.

## Already pending

- [x] New résumé PDF: the Reactive Resume export is now `public/files/NeilFoxcroftResume.pdf` (2026-10-29).
- [ ] Restyle the CV to match the site (Neil plans to do this in Reactive Resume). While at it: page 2 holds only the language levels, and the PDF includes a phone number and photo, which will be public once deployed. Decide whether to keep them.
- [x] Shoprite Financial Services URL: links to the Shoprite Holdings financial services page (2026-10-29).
- [ ] Check the site with reduced motion on (Windows: Settings → Accessibility → Visual effects → Animation effects off).
- [ ] Step 6, deploy: confirm the S3 bucket / CloudFront setup, set `404.html` as the error page, and ship the `redesign` branch.
