# TODO

Open work on neilfoxcroft.com. Content lives in `src/data/resume.json` unless noted.

## Content to write (Neil)

- [ ] **Education detail panes**: flesh out the text shown when an education card is clicked (`education[].summary`).
  - BSc Information Technology still shows a `[Placeholder…]`.
  - BSc Honours could say more than the current one-liner (thesis, modules, highlights).
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

- [ ] New résumé PDF to replace `public/files/NeilFoxcroftResume.pdf` (the current one is the old 2020 version).
- [ ] Shoprite Financial Services URL, if it should link out like the other companies.
- [ ] Check the site with reduced motion on (Windows: Settings → Accessibility → Visual effects → Animation effects off).
- [ ] Step 6, deploy: confirm the S3 bucket / CloudFront setup, set `404.html` as the error page, and ship the `redesign` branch.
