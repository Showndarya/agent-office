# Security policy

## Reporting a vulnerability

Please do not publish secrets, exploit details, private transcripts, or live runner tokens in a public issue. Report a vulnerability privately through GitHub's security-advisory flow for this repository.

## Deployment responsibilities

Agent Office handles personal conversations and can request work from a local runner. A safe deployment should:

- protect the entire Worker with Cloudflare Access;
- restrict the Access policy to intended email addresses;
- use a dedicated, high-entropy `RUNNER_TOKEN`;
- keep the Access service token and `runner/.env` off GitHub;
- confine the runner to a dedicated workspace;
- preserve the separate build and deploy approval gates;
- review model-provider logging and retention settings;
- avoid adding shell, purchase, messaging, or credential capabilities without an explicit threat review.

If any token enters Git history, rotate it immediately. Removing it from the latest file is not sufficient because earlier commits remain accessible.
