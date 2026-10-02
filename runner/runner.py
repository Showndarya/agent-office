#!/usr/bin/env python3
"""Imperial Command Mac runner: ordinary builds plus Luke's approved workshop lane."""

from __future__ import annotations

import json
import os
import platform
import shutil
import signal
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


BASE_URL = os.environ.get("AGENT_OFFICE_URL", "").rstrip("/")
RUNNER_TOKEN = os.environ.get("AGENT_OFFICE_RUNNER_TOKEN", "")
ACCESS_ID = os.environ.get("CF_ACCESS_CLIENT_ID", "")
ACCESS_SECRET = os.environ.get("CF_ACCESS_CLIENT_SECRET", "")
RUNNER_ID = os.environ.get("AGENT_OFFICE_RUNNER_ID", platform.node() or "mac-runner")
RUNNER_NAME = os.environ.get("AGENT_OFFICE_RUNNER_NAME", "Personal computer")
WORKSPACE = Path(os.environ.get("AGENT_OFFICE_WORKSPACE", "~/Developer/agent-office")).expanduser()
WORKSHOP_ROOT = Path(
    os.environ.get("AGENT_OFFICE_WORKSHOP_ROOT", "~/.agent-office/worktrees")
).expanduser()
PROVIDER = os.environ.get("AGENT_OFFICE_PROVIDER", "codex").lower()
LOCAL_MODEL = os.environ.get("AGENT_OFFICE_LOCAL_MODEL", "")
LUKE_MODEL = os.environ.get("AGENT_OFFICE_LUKE_MODEL", "gpt-6-luna")
POLL_SECONDS = max(5, int(os.environ.get("AGENT_OFFICE_POLL_SECONDS", "12")))
TASK_TIMEOUT = max(60, int(os.environ.get("AGENT_OFFICE_TASK_TIMEOUT", "3600")))
DEPLOY_TIMEOUT = max(180, int(os.environ.get("AGENT_OFFICE_DEPLOY_TIMEOUT", "1200")))
DEFAULT_CODEX = "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"
CODEX_BIN = os.environ.get("CODEX_BIN", DEFAULT_CODEX)
STOP = False

WORKSHOP_ALLOWED = ("src/", "worker/", "public/")
WORKSHOP_ALLOWED_FILES = {"README.md"}
WORKSHOP_FORBIDDEN = (
    "migrations/", "runner/", ".github/", ".codex/", ".env", ".dev.vars",
    "package.json", "package-lock.json", "wrangler.jsonc", "worker-configuration.d.ts",
)


def stop(_signum: int, _frame: Any) -> None:
    global STOP
    STOP = True


def request_headers() -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {RUNNER_TOKEN}",
        "User-Agent": "AgentOfficeMacRunner/2.0",
    }
    if ACCESS_ID and ACCESS_SECRET:
        headers["CF-Access-Client-Id"] = ACCESS_ID
        headers["CF-Access-Client-Secret"] = ACCESS_SECRET
    return headers


def api(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    headers = {**request_headers(), "Content-Type": "application/json"}
    request = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Imperial Command returned HTTP {error.code}: {detail[:400]}") from error


def run_command(
    command: list[str], cwd: Path, timeout: int, label: str
) -> subprocess.CompletedProcess[str]:
    process = subprocess.run(
        command, cwd=cwd, capture_output=True, text=True, timeout=timeout, check=False
    )
    if process.returncode != 0:
        diagnostic = (process.stderr or process.stdout).strip()[-2400:]
        raise RuntimeError(f"{label} failed: {diagnostic or f'exit {process.returncode}'}")
    return process


def git(*args: str, cwd: Path = WORKSPACE, timeout: int = 120) -> str:
    return run_command(["git", *args], cwd, timeout, "Git").stdout.strip()


def health_check() -> None:
    request = urllib.request.Request(
        f"{BASE_URL}/api/status", headers=request_headers(), method="GET"
    )
    last_error: Exception | None = None
    for _ in range(6):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status == 200:
                    return
        except Exception as error:
            last_error = error
        time.sleep(5)
    raise RuntimeError(f"The deployed office did not pass its health check: {last_error}")


def codex_command(output_path: str, prompt: str, cwd: Path, model: str = "") -> list[str]:
    binary = CODEX_BIN if Path(CODEX_BIN).exists() else (shutil.which("codex") or CODEX_BIN)
    command = [
        binary,
        "exec",
        "--ephemeral",
        "--approve-for-me",
        "--sandbox",
        "workspace-write",
        "--cd",
        str(cwd),
        "--output-last-message",
        output_path,
    ]
    if PROVIDER == "ollama":
        command.extend(["--oss", "--local-provider", "ollama"])
        if LOCAL_MODEL:
            command.extend(["--model", LOCAL_MODEL])
    elif model:
        command.extend(["--model", model])
    command.append(prompt)
    return command


def run_codex(prompt: str, cwd: Path, model: str = "") -> str:
    with tempfile.NamedTemporaryFile(prefix="agent-office-", suffix=".txt", delete=False) as output:
        output_path = output.name
    try:
        run_command(
            codex_command(output_path, prompt, cwd, model),
            cwd,
            TASK_TIMEOUT,
            "Codex",
        )
        result_path = Path(output_path)
        result = result_path.read_text(encoding="utf-8").strip() if result_path.exists() else ""
        return result or "Work completed. Codex did not return a written summary."
    finally:
        Path(output_path).unlink(missing_ok=True)


def execute_task(task: dict[str, Any]) -> str:
    prompt = "\n".join(
        [
            "You are Grand Moff Tarkin, Imperial Command's senior researcher and systems architect.",
            "This is a council build: Tarkin leads evidence checks, architecture, and implementation; Emperor Palpatine acts as the senior strategist, practical implementor, and mentor who pressure-tests trade-offs, rollout, and maintainability; Darth Vader owns the outcome and expects a decision-ready return.",
            "Use those functions as a compact internal review process, not as a role-play transcript.",
            f"Work only inside this configured workspace: {WORKSPACE}",
            "Complete the requested code change, inspect existing work first, preserve unrelated changes, and run proportionate checks.",
            "Do not deploy, publish, purchase anything, change credentials, or contact anyone.",
            "Finish with a concise summary of what changed and what you verified.",
            "",
            f"Task: {task.get('title', '')}",
            f"Notes: {task.get('description', '')}",
        ],
    )
    return run_codex(prompt, WORKSPACE)


def clean_workspace_required() -> str:
    if git("status", "--porcelain=v1"):
        raise RuntimeError(
            "Luke paused safely because the main project has uncommitted changes. "
            "Review and commit them before retrying the workshop build."
        )
    return git("rev-parse", "HEAD")


def worktree_path(proposal_id: int) -> Path:
    return WORKSHOP_ROOT / f"proposal-{proposal_id}"


def changed_paths(cwd: Path) -> list[str]:
    paths: list[str] = []
    status = git("status", "--porcelain=v1", "--untracked-files=all", cwd=cwd)
    for line in status.splitlines():
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if path:
            paths.append(path)
    return sorted(set(paths))


def path_is_allowed(path: str) -> bool:
    if path in WORKSHOP_ALLOWED_FILES:
        return True
    if path.startswith(WORKSHOP_FORBIDDEN) or any(part == ".." for part in Path(path).parts):
        return False
    return path.startswith(WORKSHOP_ALLOWED)


def create_worktree(proposal_id: int) -> tuple[Path, str, str]:
    base_commit = clean_workspace_required()
    WORKSHOP_ROOT.mkdir(parents=True, exist_ok=True)
    path = worktree_path(proposal_id)
    if path.exists():
        raise RuntimeError(
            f"The previous experiment remains at {path}. It was preserved for review; "
            "remove it manually before retrying."
        )
    branch_name = f"luke/proposal-{proposal_id}-{int(time.time())}"
    git("worktree", "add", "-b", branch_name, str(path), base_commit)
    node_modules = WORKSPACE / "node_modules"
    if node_modules.is_dir():
        (path / "node_modules").symlink_to(node_modules, target_is_directory=True)
    return path, branch_name, base_commit


def execute_improvement_build(improvement: dict[str, Any]) -> tuple[str, str, str]:
    proposal_id = int(improvement["id"])
    path, branch_name, base_commit = create_worktree(proposal_id)
    prompt = "\n".join(
        [
            "You are Luke Skywalker, Imperial Command's rotating software intern and a gifted, careful coder.",
            "Implement exactly one approved low-risk experiment. Be curious, concise, and conservative.",
            "This is an isolated Git worktree. Production has NOT been approved.",
            "You may edit only src/, worker/, public/, and README.md.",
            "Do not edit migrations, runner code, package files, lockfiles, Wrangler configuration, generated types, authentication, authorization, billing, secrets, deployment settings, or external integrations.",
            "Do not add dependencies. Do not deploy, publish, purchase, contact people, or write outside this worktree.",
            "Inspect the implementation first, prefer the smallest maintainable change, and run the existing build and lint checks.",
            "Finish with a concise report covering changed behavior, files, tests, limitations, and rollback.",
            "",
            f"Approved proposal: {improvement.get('title', '')}",
            f"Problem: {improvement.get('problem', '')}",
            f"Implementation: {improvement.get('proposal', '')}",
            f"Expected benefit: {improvement.get('benefit', '')}",
            f"Acceptance tests: {json.dumps(improvement.get('acceptanceTests') or [])}",
            f"Granted permissions: {json.dumps(improvement.get('permissions') or [])}",
        ]
    )
    report = run_codex(prompt, path, str(improvement.get("actionModel") or LUKE_MODEL))
    changes = changed_paths(path)
    if not changes:
        raise RuntimeError("Luke returned without a code change, so the experiment was not advanced.")
    blocked = [item for item in changes if not path_is_allowed(item)]
    if blocked:
        raise RuntimeError(
            "Luke touched protected project areas; the isolated experiment was stopped: "
            + ", ".join(blocked)
        )
    run_command(["npm", "run", "build"], path, TASK_TIMEOUT, "Workshop build")
    run_command(["npm", "run", "lint"], path, TASK_TIMEOUT, "Workshop lint")
    git("add", "--all", cwd=path)
    git(
        "-c", "user.name=Luke Skywalker",
        "-c", "user.email=luke@agent-office.local",
        "commit", "-m", f"Luke workshop proposal #{proposal_id}",
        cwd=path,
    )
    commit = git("rev-parse", "HEAD", cwd=path)
    summary = "\n\n".join(
        [
            report,
            "### Workshop evidence",
            f"- Isolated branch: {branch_name}",
            f"- Commit: {commit}",
            f"- Changed: {', '.join(changes)}",
            "- npm run build passed",
            "- npm run lint passed",
            "- Production remains unchanged until separate deploy approval",
        ]
    )
    return summary, branch_name, base_commit


def locate_worktree(proposal_id: int, branch_name: str) -> Path:
    path = worktree_path(proposal_id)
    if not path.is_dir():
        raise RuntimeError("The approved experiment worktree is missing; rebuild it first.")
    if git("branch", "--show-current", cwd=path) != branch_name:
        raise RuntimeError("The experiment branch no longer matches the approved build evidence.")
    return path


def execute_improvement_deploy(improvement: dict[str, Any]) -> str:
    proposal_id = int(improvement["id"])
    branch_name = str(improvement.get("branchName") or "")
    base_commit = str(improvement.get("baseCommit") or "")
    if not branch_name or not base_commit:
        raise RuntimeError("The approved build evidence is incomplete; deployment remains locked.")
    current_head = clean_workspace_required()
    path = locate_worktree(proposal_id, branch_name)
    if changed_paths(path):
        raise RuntimeError("The experiment changed after its approved build. Rebuild it first.")
    if current_head != base_commit:
        git("rebase", current_head, cwd=path, timeout=300)
    run_command(["npm", "run", "build"], path, TASK_TIMEOUT, "Release build")
    run_command(["npm", "run", "lint"], path, TASK_TIMEOUT, "Release lint")
    deployed = False
    try:
        run_command(["npm", "run", "deploy"], path, DEPLOY_TIMEOUT, "Cloudflare deployment")
        deployed = True
        health_check()
    except Exception:
        if deployed:
            try:
                run_command(
                    ["npx", "wrangler", "rollback", "-y", "-m", f"Automatic rollback for Luke proposal {proposal_id}"],
                    path,
                    DEPLOY_TIMEOUT,
                    "Cloudflare rollback",
                )
            except Exception as rollback_error:
                raise RuntimeError(
                    f"Deployment health check failed and rollback needs attention: {rollback_error}"
                )
        raise
    git("merge", "--ff-only", branch_name, cwd=WORKSPACE, timeout=300)
    git("worktree", "remove", str(path), cwd=WORKSPACE, timeout=300)
    git("branch", "-d", branch_name, cwd=WORKSPACE)
    return "\n".join(
        [
            "### Release complete",
            "- Final build and lint checks passed",
            "- Cloudflare deployment completed",
            "- The live office health check returned successfully",
            "- The approved commit was fast-forwarded into the main project",
            "- The temporary worktree was removed; Git history retains the rollback point",
        ]
    )


def run_improvement(improvement: dict[str, Any]) -> None:
    proposal_id = int(improvement["id"])
    phase = str(improvement.get("phase") or "")
    print(f"Luke {phase} #{proposal_id}: {improvement.get('title', '')}", flush=True)
    try:
        if phase == "build":
            result, branch_name, base_commit = execute_improvement_build(improvement)
            api(
                f"/api/runner/improvements/{proposal_id}/build/complete",
                {"runnerId": RUNNER_ID, "result": result,
                 "branchName": branch_name, "baseCommit": base_commit},
            )
        elif phase == "deploy":
            result = execute_improvement_deploy(improvement)
            api(
                f"/api/runner/improvements/{proposal_id}/deploy/complete",
                {"runnerId": RUNNER_ID, "result": result},
            )
        else:
            raise RuntimeError("The workshop returned an unknown phase.")
        print(f"Luke {phase} #{proposal_id} completed", flush=True)
    except Exception as error:
        endpoint = "build" if phase == "build" else "deploy"
        api(
            f"/api/runner/improvements/{proposal_id}/{endpoint}/complete",
            {"runnerId": RUNNER_ID, "error": str(error)[:2800]},
        )
        print(f"Luke {phase} #{proposal_id} stopped safely: {error}", flush=True)


def validate() -> None:
    missing = []
    if not BASE_URL:
        missing.append("AGENT_OFFICE_URL")
    if not RUNNER_TOKEN:
        missing.append("AGENT_OFFICE_RUNNER_TOKEN")
    if missing:
        raise RuntimeError(f"Missing configuration: {', '.join(missing)}")
    if not WORKSPACE.is_dir():
        raise RuntimeError(f"Workspace does not exist: {WORKSPACE}")
    binary = CODEX_BIN if Path(CODEX_BIN).exists() else shutil.which("codex")
    if not binary:
        raise RuntimeError("Codex CLI was not found. Set CODEX_BIN in runner/.env.")
    git("rev-parse", "--is-inside-work-tree")


def main() -> None:
    validate()
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    print(f"Imperial Command runner ready: {RUNNER_NAME} · {WORKSPACE} · {PROVIDER}", flush=True)

    while not STOP:
        try:
            workshop = api(
                "/api/runner/improvements/claim",
                {"runnerId": RUNNER_ID, "name": RUNNER_NAME},
            ).get("improvement")
            if workshop:
                run_improvement(workshop)
            else:
                response = api("/api/runner/claim", {"runnerId": RUNNER_ID, "name": RUNNER_NAME})
                task = response.get("task")
                if task:
                    print(f"Starting task #{task['id']}: {task['title']}", flush=True)
                    try:
                        result = execute_task(task)
                        api(
                            f"/api/runner/tasks/{task['id']}/complete",
                            {"runnerId": RUNNER_ID, "result": result},
                        )
                        print(f"Completed task #{task['id']}", flush=True)
                    except Exception as error:  # report failures without stopping the service
                        api(
                            f"/api/runner/tasks/{task['id']}/complete",
                            {"runnerId": RUNNER_ID, "error": str(error)[:1800]},
                        )
                        print(f"Task #{task['id']} failed: {error}", flush=True)
        except Exception as error:
            print(f"Runner connection error: {error}", flush=True)

        if os.environ.get("AGENT_OFFICE_RUN_ONCE") == "1":
            break
        for _ in range(POLL_SECONDS):
            if STOP:
                break
            time.sleep(1)


if __name__ == "__main__":
    main()
