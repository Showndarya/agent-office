# Contributing

Agent Office favors small changes with visible behavior and few moving parts.

## Before opening a pull request

1. Keep authentication, billing, retention, and runner changes narrow and explicit.
2. Use a new numbered migration for database changes; never edit a migration that users may already have applied.
3. Do not add credentials, `.env` files, personal profile data, private chat exports, or licensed media.
4. Avoid new dependencies unless they materially reduce complexity or risk.
5. Run the checks:

```bash
npm ci
npm run build
npm run lint
python3 -m py_compile runner/runner.py
```

## Pull-request notes

Explain the user-visible outcome, model or infrastructure cost, data-retention effect, permissions added, failure behavior, and rollback path. Screenshots should use synthetic data.

The themed characters are a replaceable example. Contributions should keep the core system useful for people who choose a completely different cast and visual style.
