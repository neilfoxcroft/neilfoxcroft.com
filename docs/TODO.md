# TODO

Open work on neilfoxcroft.com. Content lives in `src/data/resume.json` unless noted.

## Content to write (Neil)

- [x] **Education detail panes**: flesh out the text shown when an education card is clicked (`education[].summary`, plus optional `activities`).
  - [x] BSc Information Technology: RAG Technical Committee and residence activities (2026-10-29).
  - [x] BSc Honours: specialisations and the StyleGAN detection project (2026-10-29).
- [x] **StyleGAN detection project** added to `projects` (2026-10-29), linking to the repo. Later: maybe a page of its own; the Honours box links to the project card (`#stylegan`).
- [x] **PCT extras** in `pct`:
  - [x] days on trail (164: 14 Apr – 24 Sep 2026) and pairs of shoes (4), added 2026-10-29
  - [x] the intro story (2026-10-29)
  - [x] **trail stats page** (`pct.moreStats` → /trail-stats/, added 2026-10-29): the numbers are in (2026-10-29; steps is a guesstimate Neil may replace); the Refill story is in too (2026-10-29). Mark guesses with `"guess": true`; add `"note"` for a hover explanation.
  - [x] seven photos, one per section (2026-10-29): src/assets/pct/pct-1.jpg … pct-7.jpg (Start, Desert, Sierra, NorCal, Oregon, Washington, End), each with alt text in resume.json.

- [x] **Places globe** (`/places/`, the easter egg behind "open to relocation", added 2026-10-29): Neil's list is in (2026-10-29). To add more, edit `places.countries` / `places.usStates` in resume.json. Names must match the map data exactly (e.g. "United States of America", "United Kingdom"); the build says which name it doesn't recognise.

## Features to consider

- [ ] **Get in touch / contact**: a contact section on the page, or its own page. Today there's only the email icon in the header.
- [ ] **km / mi switch design**: the current version (faint globe that grows into a `km │ mi` pill on hover, with a sliding highlight) is provisional, and the US flag is a placeholder drawing. Revisit the look (src/components/UnitToggle.astro).

- [x] **Visitor analytics** (2026-10-29): GoatCounter added (code `foxcroft`, dashboard https://foxcroft.goatcounter.com), production builds only. Background: CloudFront access logs (and WAF logs) are **not available on the CloudFront Free plan** (paid plans only, from Pro at $15/month; tried 2026-10-29, AWS refused). Free options: CloudFront console Reports & analytics and the plan's Security dashboard (aggregate), or a cookie-free analytics service such as GoatCounter (Neil would create the account).

- [x] **Tidy AWS storage that grows with every deploy** (done 2026-10-30): lifecycle rule `expire-pipeline-artifacts-after-30-days` on `codepipeline-eu-west-2-30919856588` (prefix `cicd-neilfoxcroft/`, also aborts unfinished uploads after 7 days), and 30-day retention on the log group `/aws/codebuild/neilfoxcroft-build`. Each deploy costs about $0.001 (2 of the 100 free build minutes a month; the pipeline is in the always-free tier).
- Note: AWS Cost Explorer API calls cost $0.01 each; check costs in the console (Billing → Cost Explorer) instead of the CLI.

- [ ] **After the next deploy: submit the sitemap** https://neilfoxcroft.com/sitemap.xml in Google Search Console (and Bing Webmaster Tools) so the new pages get indexed quickly.
- [x] **Security headers on CloudFront** (live 2026-10-30; Neil ran `node infra/apply-security-headers.mjs`): the Free plan refuses custom response headers policies (tried 2026-10-30), so the script attaches AWS's managed Managed-SecurityHeadersPolicy (HSTS, nosniff, X-Frame-Options SAMEORIGIN, strict-origin-when-cross-origin referrer, X-XSS-Protection) and deletes the unused custom policy. The full CSP ships in the pages.
- [ ] Minor: the default CloudFront address (d1397v5vx9uxmk.cloudfront.net) also serves the site; harmless (canonical tags point to neilfoxcroft.com), could redirect it later.

## Already pending

- [x] New résumé PDF: the Reactive Resume export is now `public/files/NeilFoxcroftResume.pdf` (2026-10-29).
- [x] Updated CV (2026-10-29): one page, no photo, new layout. Neil is fine with the phone number being public. A restyle to match the site colours is still optional.
- [x] Shoprite Financial Services URL: links to the Shoprite Holdings financial services page (2026-10-29).
- [ ] Check the site with reduced motion on (Windows: Settings → Accessibility → Visual effects → Animation effects off).
- [x] **AWS CodeBuild source** (done 2026-10-29: pipeline cicd-neilfoxcroft now pulls neilfoxcroft/neilfoxcroft.com) (Neil, in the AWS console, eu-west-2): the GitHub repo was renamed to `neilfoxcroft/neilfoxcroft.com` on 2026-10-29 (was `neilfoxcroft.com-repo`). Point the CodeBuild project's source at the new name. GitHub redirects the old one, but don't rely on it, and never create a new repo called `neilfoxcroft.com-repo`, or the redirect breaks.
- [ ] **Step 6, deploy** (plan agreed with Neil 2026-10-29; AWS profile `personal` = account 433102245367). Current setup, read-only look 2026-10-29:
  - CloudFront `EAQFNSEB53K0Y` (neilfoxcroft.com + www, ACM cert valid to 2027-04, managed CachingOptimized policy, no functions) in front of the public S3 bucket `neilfoxcroft.com` (REST endpoint, no versioning, 139 old files, 44 MB). Errors 400/403 → /index.html with 200 (old React set-up), so folder URLs and missing pages both show the home page.
  - CodePipeline `cicd-neilfoxcroft` (eu-west-2): Source = GitHub connection `nfoxcroft-github`, branch `master` of `neilfoxcroft/neilfoxcroft.com-repo` (old name) → CodeBuild `neilfoxcroft-build` (image amazonlinux2 standard:3.0, Node 12/14 only) → S3 deploy (extract; no deletes, no cache headers, no invalidation).
  - Costs ~$0.59/month (mostly the Route 53 zone); a $5/month budget alert already exists. Domain registered outside AWS; DNS in Route 53.
  - Plan: (1) back up the old site from S3 locally; (2) pipeline source → `neilfoxcroft/neilfoxcroft.com`; (3) CodeBuild image → amazonlinux standard:5.0 (Node 22); (4) buildspec: Node 22, `npm ci`, build, `aws s3 sync dist/ --delete` with cache headers (HTML no-cache, `/_astro/*` a year, immutable), CloudFront invalidation; give the CodeBuild role S3 + invalidation rights and drop the pipeline's S3 deploy stage; (5) CloudFront Function adding index.html to folder URLs, and 403/404 → /404.html with status 404; (6) merge `redesign` → `master` via a PR, watch the pipeline, check the live site.
  - Done 2026-10-29: old site backed up to `dev/personal/neilfoxcroft-old-site-backup-2026-10-29/` (139 files, plus bucket policy and CloudFront config snapshots); S3 locked behind CloudFront: Origin Access Control `EQC3RTBNLCNVG`, bucket policy allows only distribution EAQFNSEB53K0Y, Block Public Access on, S3 website hosting off (direct S3 requests now 403).
  - Done 2026-10-29: distribution subscribed to the CloudFront **Free flat-rate plan** ($0, no overage charges; Neil in the console; Route 53 zone attachment not yet confirmed — check the plan page or next bill). Its WAF web ACL `CreatedByCloudFront-5d764852` now blocks: rule 0 `rate-limit-per-ip` (500 requests / 5 min per IP), then AWS IP reputation, Common rule set and Known bad inputs (switched from Count to their own Block actions; original saved next to the backup). Verified in WAF sampled requests: XSS and path-traversal probes BLOCK, normal visits ALLOW. Note: the old 403 → /index.html (200) error mapping hides WAF blocks as the home page; in the 404 step, drop the 403 mapping (grant CloudFront s3:ListBucket so missing files are 404) and map only 404 → /404.html.
  - Done 2026-10-29: CodeBuild image → `amazonlinux-x86_64-standard:6.0` (buildspec uses Node 24: Astro needs ≥22.23.4); CodeBuild role got inline policy `deploy-neilfoxcroft-site` (list/put/get/delete in the site bucket, invalidations on EAQFNSEB53K0Y only); pipeline `cicd-neilfoxcroft` now Source (`neilfoxcroft/neilfoxcroft.com`, master) → Build, the old S3 Deploy stage removed. buildspec.yml (on redesign) builds, syncs to S3 with cache headers (`_astro/` a year, immutable; everything else browser-revalidate + 1 day at CloudFront) and invalidates. Previous settings saved next to the backup (`…-codebuild-env.json`, `…-pipeline.json`, `…-waf-before.json`).
  - Done 2026-10-29: CloudFront Function `neilfoxcroft-index-rewrite` (infra/cloudfront-index-rewrite.js) created, tested and published, **not attached yet**. At go-live, right after the new site is deployed: attach it (viewer request), add `s3:ListBucket` for CloudFront to the bucket policy, and replace the custom error responses with 404 → /404.html (status 404). Doing it earlier would break the old React site's deep links.
  - Done 2026-10-29: cost alerts to Neil's Gmail: budget `early-warning` ($1/month, actual) next to `total-cost-budget` ($5), and Cost Anomaly Detection (monitor `all-services`, daily email for anomalies of $1+). AWS has no hard spending cap; these alert only.
  - Tidy later: two dead legacy GitHub webhooks in CodePipeline (one targets a pipeline that no longer exists), the empty `www.neilfoxcroft.com` redirect bucket. Security (done 2026-10-29): the `personal` profile now signs in with `aws login` as the IAM admin user `neilfoxcroft` (MFA added, unused 2022 access key deleted, no access keys); the cached root session was deleted, so root is not used on this machine. An unassigned virtual MFA device `Iphone` is left over from setup and can be deleted.
