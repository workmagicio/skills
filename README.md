# WorkMagic Public Skills

Agent skills for operating [WorkMagic](https://workmagic.io) — incrementality / lift testing,
attribution analysis, media budget optimization, and growth diagnostics. Each skill is a self-contained
[Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview):
a directory under [`skills/`](skills/) containing a `SKILL.md` with `name` + `description`
frontmatter and the playbook body.

Skills are plain Markdown — model-agnostic. The sections below show how to load them into
Claude, OpenAI, and other mainstream AI tools.

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

### Growth Diagnostics

- **[dtc-marketing-diagnostic](skills/dtc-marketing-diagnostic/SKILL.md)** — Structural quarterly growth diagnostic for North American DTC brands: from a `tenant_id` to an operator-voice report + multi-sheet Excel data pack + 90-day plan in ~30 minutes. For QBR prep, onboarding audits, and scale decisions.

---

## Get the skills

```bash
git clone https://github.com/workmagicio/skills.git workmagic-skills
cd workmagic-skills
```

Everything below assumes you've cloned the repo and are inside it.

---

## Claude

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

```bash
cd workmagic-skills && git pull
```

If you symlinked into `~/.claude/skills/`, updates apply automatically. If you copied the
folders, re-copy after pulling.
