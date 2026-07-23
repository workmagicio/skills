# WorkMagic Public Skills

Agent skills for operating [WorkMagic](https://workmagic.io) — incrementality / lift testing,
attribution analysis, media budget optimization, and growth diagnostics. Each skill is a self-contained
[Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview):
a directory under [`skills/`](skills/) containing a `SKILL.md` with `name` + `description`
frontmatter and the playbook body.

Skills are plain Markdown — model-agnostic. The sections below show how to load them into
Claude, OpenAI, and other mainstream AI tools.

---

## Quick start

**Two ways to use these skills — pick by how you access WorkMagic:**

| You access WorkMagic through… | Use | Install | Updates |
| --- | --- | --- | --- |
| **A chat app** — ChatGPT, Claude.ai (web/desktop) | **WorkMagic MCP** — skills are built in (`skills-list` / `skills-read`) | Just connect the MCP server | **Automatic** — always the latest |
| **A coding agent / CLI** — Claude Code, Codex, Cursor, Gemini CLI | **This repo** via `npx skills` | `npx skills add github.com/workmagicio/skills` | `npx skills update` |

Chat apps can't install GitHub skills — they get them through the MCP. CLI agents can use either. See [Install](#install) and [Updating](#updating).

---

## Catalog

### Understanding Incrementality

- **[lift-test-creation](skills/lift-test-creation/SKILL.md)** — Turn a request into a well-configured geo lift test draft and create it in the platform.
- **[lift-test-readout](skills/lift-test-readout/SKILL.md)** — Interpret completed lift test results (incremental ROAS, confidence intervals) and recommend next steps.

### Reading Your Data

- **[attribution-data-query](skills/attribution-data-query/SKILL.md)** — Translate an explicit attribution data request into a precise SQL query and return results.
- **[attribution-intent-clarification](skills/attribution-intent-clarification/SKILL.md)** — Ask one focused question to resolve an ambiguous query, then hand it off.
- **[attribution-anomaly-diagnosis](skills/attribution-anomaly-diagnosis/SKILL.md)** — Diagnose "why" anomalies: attribution = 0 and sudden swings.
- **[attribution-model-comparison](skills/attribution-model-comparison/SKILL.md)** — Compare attribution across models side-by-side and explain the differences.
- **[attribution-custom-report](skills/attribution-custom-report/SKILL.md)** — Persist a data request as a WorkMagic dashboard or a shareable HTML report.
- **[attribution-weekly-report](skills/attribution-weekly-report/SKILL.md)** — Schedule attribution reports and alerts that are delivered automatically.
- **[attribution-custom-dimension](skills/attribution-custom-dimension/SKILL.md)** — Slice by a business label (region, audience, brand) via Naming Convention rules.
- **[attribution-edge-routing](skills/attribution-edge-routing/SKILL.md)** — Route requests that fall outside attribution's capability boundary.

### Budget Optimization

- **[mbo-create-scenario](skills/mbo-create-scenario/SKILL.md)** — Turn a budget-allocation ask into a forward-looking MBO (Media Budget Optimizer) scenario; also handles modifications.
- **[mbo-read-scenario](skills/mbo-read-scenario/SKILL.md)** — Interpret the results of an existing MBO scenario.

---

## Install

### Recommended for CLI agents: `npx skills`

Works with Claude Code, Codex, Cursor, Gemini CLI, and 70+ agents — one command to install, one to update:

```bash
npx skills add github.com/workmagicio/skills   # install all skills
npx skills update                               # pull the latest
```

To stay current automatically, schedule the update (cron or your shell startup):

```bash
0 9 * * *  npx -y skills update --yes
```

### Chat apps (ChatGPT, Claude.ai): use the WorkMagic MCP

ChatGPT and Claude.ai (web/desktop) can't install GitHub skills — they load the **same skills through the WorkMagic MCP** (`skills-list` / `skills-read`), which **updates automatically** (nothing to reinstall). Connect the MCP server:

- Server URL: `https://mcp.workmagic.io/mcp`
- **Claude.ai / Desktop:** Settings → Connectors → Add custom connector
- **ChatGPT:** enable Developer Mode (Plus/Pro/Business/Enterprise), then add the connector

### Claude Code plugin marketplace (native)

```bash
/plugin marketplace add workmagicio/skills
/plugin install workmagic-skills@workmagic
```

### Manual (fallback)

```bash
git clone https://github.com/workmagicio/skills.git workmagic-skills
cd workmagic-skills
```

Then load the folders into your tool (see the per-platform notes below). Prefer `npx skills` or the MCP above — a manual copy does **not** auto-update.

---

## Claude

> **Chat / claude.ai users:** the easiest path is the [WorkMagic MCP](#chat-apps-chatgpt-claudeai-use-the-workmagic-mcp) — skills are built in and auto-update, with nothing to install. The steps below are for loading the skill *files* into Claude Code / SDK / API.

### Claude Code (CLI / IDE)

Claude Code auto-discovers skills and invokes them on its own based on each skill's
`description`. Install by placing the skill folders where Claude Code looks for them.

**Personal — available in every project:**

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD"/skills/*/ ~/.claude/skills/   # symlink (stays in sync with git pull)
# or copy instead of symlink:
# cp -R skills/*/ ~/.claude/skills/
```

**Project-scoped — committed with one repo, shared with the team:**

```bash
mkdir -p .claude/skills
cp -R /path/to/workmagic-skills/skills/*/ .claude/skills/
```

Restart Claude Code (or run `/skills`) and the WorkMagic skills will be listed. No manual
invocation needed — Claude reads the descriptions and applies the right skill when relevant.

### Claude Agent SDK

The SDK reads the same `.claude/skills/` layout. Point it at a directory that contains the
skill folders (project-local `.claude/skills/` or `~/.claude/skills/`) and enable filesystem
settings so skills are discovered:

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

options = ClaudeAgentOptions(
    setting_sources=["project", "user"],   # load .claude/skills from project + ~/.claude
    allowed_tools=["Skill"],
)
```

### Claude API / claude.ai

Upload a skill folder (the directory containing `SKILL.md`) through the
[Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
interface — the Skills section of claude.ai settings, or the Skills API. The model loads a
skill's body on demand when its `description` matches the task.

---

## OpenAI

OpenAI tools have no auto-discovery mechanism, so a skill is loaded as **instructions /
knowledge / context**. The `SKILL.md` body is the payload; the `description` tells you (or a
router) when to use it.

### Codex CLI

Reference the skills from your `AGENTS.md` so Codex picks the right one:

```markdown
# AGENTS.md
For WorkMagic tasks, follow the matching playbook in ./skills/<name>/SKILL.md.
Pick the skill whose description matches the request before acting.
```

### Custom GPT

Create a GPT and upload the `SKILL.md` files as **Knowledge**. In the GPT instructions, add:
"When a request matches a skill's description, follow that skill's steps." Each file's
frontmatter description doubles as the routing hint.

### Assistants / Responses API

Two common patterns:

- **File search (retrieval):** upload the `SKILL.md` files to a vector store and attach it,
  letting the model retrieve the relevant skill at query time.
- **Inline context:** read the relevant `SKILL.md` and pass its body in the `system` /
  `instructions` field. To auto-route, send all skill `description`s to a cheap model first,
  pick the best match, then load that one skill's body.

```python
from openai import OpenAI
client = OpenAI()
skill = open("skills/attribution-data-query/SKILL.md").read()
resp = client.responses.create(
    model="gpt-5",
    instructions=skill,           # load the chosen skill as the system prompt
    input="Show me ROAS by channel for the last 30 days",
)
```

---

## Other AI tools

The skills are vendor-neutral Markdown, so any agent that accepts a system prompt, rules
file, or knowledge base can use them.

- **Cursor / Windsurf:** copy a `SKILL.md` into `.cursor/rules/` (or paste its body into a
  rule) to make it part of the editor's context.
- **Gemini / other LLM APIs:** pass the chosen `SKILL.md` body as the system instruction,
  or index all skills in a RAG store and retrieve by `description`.
- **Any custom agent:** treat each `description` as a router key and each `SKILL.md` body as
  the procedure to follow once selected.

> **Routing tip:** every skill's frontmatter `description` is written as "what it does + when
> to use / when not to." For tools without built-in skill selection, feed all 12 descriptions
> to your router/model, choose the best match, then load that single skill's body.

---

## Updating

| How you installed | How to update |
| --- | --- |
| **WorkMagic MCP** (chat apps) | Nothing to do — it always serves the latest. |
| **`npx skills`** | `npx skills update` — or schedule it (see [Install](#install)) for automatic updates. |
| **Plugin marketplace** | `/plugin marketplace update workmagic`, then reinstall the plugin. |
| **Manual `git clone` + symlink** | `cd workmagic-skills && git pull` — symlinks reflect the changes; re-run the symlink command to pick up newly added skills. |
| **Manual copy / uploaded to claude.ai / Custom GPT** | Frozen — re-copy / re-upload, or switch to the MCP for automatic updates. |

Each skill is versioned in its `SKILL.md` frontmatter (`version:` + `last-updated:`); see [CHANGELOG.md](CHANGELOG.md).
