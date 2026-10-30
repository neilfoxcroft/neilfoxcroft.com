// Attaches security headers to the neilfoxcroft.com CloudFront distribution. Run it yourself (it changes the live
// site):   node infra/apply-security-headers.mjs
//
// The distribution is on the CloudFront Free flat-rate plan, which doesn't allow custom response headers policies,
// so this attaches AWS's managed "Managed-SecurityHeadersPolicy": HSTS (1 year), X-Content-Type-Options nosniff,
// X-Frame-Options SAMEORIGIN, Referrer-Policy strict-origin-when-cross-origin and X-XSS-Protection. (The custom
// policy in infra/security-headers-policy.json is kept for if the plan ever changes.) The full Content Security
// Policy ships inside each page as a meta tag (astro.config.mjs).
//
// It checks it's talking to the site's AWS account, saves the distribution's current settings as a backup, attaches
// the managed policy, and deletes the unused custom policy an earlier run created. Safe to run more than once.
// To undo: set the default behaviour's response headers policy back to none in the CloudFront console.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROFILE = 'personal';
const ACCOUNT = '433102245367';
const DISTRIBUTION = 'EAQFNSEB53K0Y';
const MANAGED_POLICY = 'Managed-SecurityHeadersPolicy';
const UNUSED_CUSTOM_POLICY = 'neilfoxcroft-security-headers';

const aws = (...args) => {
  try {
    const out = execFileSync('aws', [...args, '--profile', PROFILE, '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(out || 'null');
  } catch (e) {
    const message = String(e.stderr || e.message).trim();
    // Logins last 12 hours; point at the fix instead of dumping a stack trace.
    if (/expired|reauthenticate|Unable to locate credentials/i.test(message)) {
      console.error(`Your AWS login for the "${PROFILE}" profile has expired. Run:  aws login --profile ${PROFILE}`);
    } else {
      console.error(`aws ${args.slice(0, 2).join(' ')} failed:\n${message}`);
    }
    process.exit(1);
  }
};

const account = aws('sts', 'get-caller-identity').Account;
if (account !== ACCOUNT) throw new Error(`Profile "${PROFILE}" is account ${account}, not ${ACCOUNT}. Run: aws login --profile ${PROFILE}`);

const policies = (type) => aws('cloudfront', 'list-response-headers-policies', '--type', type).ResponseHeadersPolicyList.Items ?? [];
const byName = (list, name) => list.find((p) => p.ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name === name);

const managed = byName(policies('managed'), MANAGED_POLICY);
if (!managed) throw new Error(`AWS managed policy ${MANAGED_POLICY} not found`);
const policyId = managed.ResponseHeadersPolicy.Id;
console.log(`Using AWS's ${MANAGED_POLICY} (${policyId})`);

const { ETag, DistributionConfig } = aws('cloudfront', 'get-distribution-config', '--id', DISTRIBUTION);
const backup = join(tmpdir(), `cloudfront-${DISTRIBUTION}-before-headers.json`);
writeFileSync(backup, JSON.stringify(DistributionConfig, null, 2));
console.log(`Backed up the current distribution settings to ${backup}`);

if (DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId === policyId) {
  console.log('The managed policy is already attached.');
} else {
  DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = policyId;
  const file = join(tmpdir(), `cloudfront-${DISTRIBUTION}-with-headers.json`);
  writeFileSync(file, JSON.stringify(DistributionConfig));
  const status = aws('cloudfront', 'update-distribution', '--id', DISTRIBUTION, '--if-match', ETag, '--distribution-config', `file://${file}`)
    .Distribution.Status;
  console.log(`Attached. Distribution status: ${status} (live everywhere in about 3 to 10 minutes).`);
}

// Tidy up: the custom policy from an earlier run can't be used on the Free plan.
const unused = byName(policies('custom'), UNUSED_CUSTOM_POLICY);
if (unused) {
  const id = unused.ResponseHeadersPolicy.Id;
  const { ETag: policyETag } = aws('cloudfront', 'get-response-headers-policy', '--id', id);
  execFileSync('aws', ['cloudfront', 'delete-response-headers-policy', '--id', id, '--if-match', policyETag, '--profile', PROFILE], { stdio: 'ignore' });
  console.log(`Deleted the unused custom policy ${UNUSED_CUSTOM_POLICY} (${id}).`);
}
