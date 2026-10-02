# Imperial Command

A private, mobile-first control plane for a tiny AI team:

- **Ask** routes through GPT-6 Luna, Sol, or Astra, so it works while the Mac is closed.
- **Research** uses the same cost-aware router plus live web search and visible source links.
- **Build** waits safely in D1 until the Mac runner is online, then uses Codex inside one configured workspace.
- **Luke’s Workshop** proposes two small office improvements each week and requires separate build and deploy approvals.

The stack stays small: one React app, one Worker, one D1 database, and one standard-library Python runner. No Docker, Redis, queues, or separate server.

## Model router

Every cloud task can use **Auto**, **Fast**, **Smart**, or **Deep**. Fast maps to GPT-6 Luna, Smart to GPT-6 Sol, and Deep to GPT-6 Astra. Auto uses a small, transparent rule in the Worker: Luna for straightforward Q&A, Sol for analysis and ordinary research, and Astra for complex or high-stakes requests. Q&A has a final Cloudflare Qwen fallback.

Requests use `store: false` and AI Gateway payload logging is disabled per request. Research performs one focused live-web pass, records cited source URLs, and has a 24-second ceiling plus a two-attempt lease. A once-per-minute recovery check guarantees abandoned cloud work becomes either complete or visibly failed instead of looping.

With Auto-assign, questions containing live-time cues such as current events, forecasts, schedules, or “latest” become Research missions. Fett gathers current evidence, Tarkin validates it and supplies the answer architecture, and Palpatine joins when strategy, implementation, risk, or mentoring would improve the result. Vader frames the problem and owns the final answer.

Every multi-agent result includes an expanded **Council work** map showing the chosen roster, why Vader selected it, and the exact function each agent supplied. The Comms Board keeps the corresponding assignment and return trail. This is transparent functional collaboration inside one bounded answer call, not four hidden model calls, so the office stays cost-effective without making the specialists disappear.

## Private agent audiences

The Command Console defaults to **Vader**, who reads the request and routes the smallest useful council. The **Talk to** selector also opens separate one-to-one threads with Fett, Tarkin, or Palpatine. A specialist answers directly in their own voice with candid independent judgment; no Vader synthesis, council handoff, or handoff-board entry is created. Each audience has isolated conversation context, while every reply still uses the same owner profile, model controls, bounded research, and nightly memory policy.

Explicitly naming an agent in Vader's routed thread is also a hard routing signal. If the prompt asks for Palpatine, Tarkin, or Fett, that agent is included in the visible council work instead of being left to a model planner's discretion.

The `agent-office` AI Gateway has Zero Data Retention enabled, log collection disabled, and a $10 rolling monthly spend limit. Third-party models require prepaid AI Gateway credits; auto top-up is intentionally off.

## Scheduled missions and alerts

The Scheduled Missions panel creates daily or twice-daily cloud jobs in Eastern time. Each schedule keeps a preferred council roster. At run time, a short Cloudflare-hosted Qwen planning call lets Vader choose the smallest useful team; when recruiting is enabled, specialists can pull in another council member and the decision appears as a real handoff on the Comms Board. One final model call synthesizes the team's work into a single concise Vader report, so coordination stays visible without multiplying expensive calls.

The once-per-minute Cron Trigger checks due schedules and a D1 uniqueness key prevents duplicate runs. Paused schedules do nothing, and **Run now** uses the same orchestration path for safe testing.

Every completed or failed task can queue one plain-text notification. Add the recipient in the dashboard, then connect Resend once:

```bash
npx wrangler secret put RESEND_API_KEY
```

The default sender is Resend's onboarding address, which is suitable for initial testing with the Resend account owner. For delivery to other recipients, verify a sending domain in Resend and add `NOTIFY_FROM_EMAIL` as a Worker variable in `wrangler.jsonc`. If the sender is not connected, missions still complete normally and the dashboard shows the remaining setup step.

## Command Console archives

Every audience thread has an explicit **New chat** action. It is available after that thread's current reply finishes. Closing a chat creates one completed, Markdown-friendly transcript in **Orders & intelligence**, led by the actual answering agent and including its models, sources, and visible council contributors, then opens an empty thread. Other audiences remain untouched. The original daily rows remain hidden but eligible for that night’s memory distillation; they are deleted only after successful consolidation. Archived task transcripts follow the task-history retention policy instead of the raw-chat midnight cleanup.

## Imperial Comms Board

The board records short task handoffs directly from task lifecycle events. These messages are deterministic and add no model cost. They remain visually separate from the live Watercooler chat.

From 7 AM through 11 PM Eastern, Cloudflare-hosted Qwen creates natural two-to-four-line exchanges at deliberately varied intervals. Most bursts continue an open conversational thread; other bursts introduce a fresh news, holiday, or office-life topic. A colleague may join an existing subject without forcing the same pair to reply forever. The generator receives an ordered recent transcript, avoids recently used topics, and rejects semantically similar lines rather than checking exact duplicates only. Qwen has a varied deterministic fallback, so chat generation can never block task maintenance.

On the first Cron tick of each Eastern calendar day, the prior day's watercooler messages and task handoff/note traffic are deleted from D1. Daily sprint reviews, completed task reports, and relationship state remain intact. The dashboard polls every five seconds, so the cleared boards refresh automatically.

Vader conducts one compact sprint review per day at 9:00 AM Eastern. A once-per-minute Cloudflare Cron Trigger handles task recovery, due schedules, natural chat timing, and daily cleanup. D1 keys prevent duplicate chat slots and guarantee one GPT-6 Luna sprint per day. Local-time guards handle daylight-saving time. If either model is unavailable, deterministic copy is stored instead.

Vader also runs a no-token weekday leadership cadence that rotates through 1:1s with Fett, Tarkin, and Palpatine, evidence-to-architecture training, morale checks, and team-building practice. Every 14 days, deterministic code turns real assignment, completion, failure, and handoff metrics into a Commander-facing development review. It gives each specialist a coaching focus and next-cycle responsibility and records Vader's own workload, training, recognition, morale, and 1:1 commitments. It cannot invent evidence, adds no model cost, and treats low assignment volume as a workload signal rather than weak performance.

## Luke’s Workshop

Luke Skywalker is a rotating software intern, not a production administrator. At 10:30 AM Eastern every Tuesday and Friday, one GPT-6 Sol planning call reviews recent task friction, failures, existing capabilities, recent proposals, and the watercooler conversation. It creates at most one narrow, reversible proposal for that rotation. Repeated or decorative ideas are explicitly rejected by the planning prompt.

The dashboard records the problem, smallest useful change, affected agents, permissions, acceptance checks, estimated cost, model route, and every approval event. The flow has two human gates:

1. **Approve isolated build** queues the proposal for the Mac. Luke uses GPT-6 Luna by default inside a dedicated Git worktree.
2. **Approve deployment** appears only after build and lint evidence returns. The runner repeats the checks, deploys, health-checks the live Worker, rolls Cloudflare back on a failed health check, and fast-forwards the approved commit into the main checkout.

The automated lane may edit only `src/`, `worker/`, `public/`, and `README.md`. It rejects changes to authentication, authorization, billing, secrets, D1 migrations, dependencies, package locks, runner code, Wrangler configuration, purchases, messages to people, and external writes. Those changes remain manual engineering work. One experiment runs at a time, and a dirty main checkout pauses Luke instead of overwriting local work.

The capability registry shows the office’s active skills, tools, and future approved plugins. A shipped workshop improvement becomes an auditable capability linked to its originating proposal. Watercooler suggestions are planning evidence only; they can never authorize code or spending.

## Project commands

```bash
npm install
npm run db:migrate:remote
npm run dev
npm run deploy
```

Useful checks:

```bash
npm run build
npm run lint
python3 -m py_compile runner/runner.py
```

## Mac runner

The runner polls for ordinary `build` tasks and separately approved Luke workshop phases. It requires both a Cloudflare Access service token and the Worker-level runner secret.

1. Copy `runner/.env.example` to `runner/.env`.
2. Fill in the two Cloudflare Access values and `AGENT_OFFICE_RUNNER_TOKEN`.
3. Test once with `AGENT_OFFICE_RUN_ONCE=1 runner/run.sh`.
4. Run `runner/install.sh` to start it at Mac login.

By default, Grand Moff Tarkin uses the Codex CLI already bundled with the ChatGPT app and is restricted to `AGENT_OFFICE_WORKSPACE` with the `workspace-write` sandbox. Luke defaults to GPT-6 Luna and receives the stricter file allowlist described above. The local Codex CLI may use the signed-in ChatGPT subscription; API-key authentication uses separate API billing. To use a local Ollama model instead, set:

```bash
AGENT_OFFICE_PROVIDER=ollama
AGENT_OFFICE_LOCAL_MODEL=your-installed-model
```

Ordinary build tasks never deploy or publish. The only automated deployment path is a Luke proposal that has already passed its separate **Approve deployment** gate. The runner still cannot change credentials, make purchases, contact people, add dependencies, or expand its own permissions.

## API

- `GET /api/agents`
- `GET /api/tasks`
- `GET /api/status`
- `GET /api/feed`
- `GET|POST /api/schedules`
- `PATCH|DELETE /api/schedules/:id`
- `POST /api/schedules/:id/run`
- `GET|PUT /api/settings`
- `GET /api/chat`
- `POST /api/chat/messages`
- `POST /api/chat/archive`
- `GET /api/workshop`
- `POST /api/workshop/proposals/:id/action`
- `POST /api/tasks` with `{ "title": "...", "taskType": "qna|research|build", "modelMode": "auto|fast|smart|deep" }`
- `POST /api/tasks/:id/retry`
- Authenticated runner routes under `/api/runner/*`

Numbered migrations create the tables and seed the original Imperial Command identities: Darth Vader, Boba Fett, Grand Moff Tarkin, and Emperor Palpatine. The stable internal IDs remain unchanged so existing tasks continue to work. Local development uses the remote D1 binding by default; `npm run dev:local` uses a local D1 mirror.
