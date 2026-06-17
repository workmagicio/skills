---
name: attribution-custom-report
description: Turn a data request into something persistent and revisitable — a WorkMagic custom dashboard or a shareable HTML artifact. Use when the user explicitly asks to save, build a dashboard, share, or generate a report (e.g. "Build me a dashboard comparing Meta vs Google", "Make a report I can send to my CMO"). Not for one-time questions (use attribution-data-query) or recurring scheduled delivery (use attribution-weekly-report).
---

# attribution-custom-report

## 1. Purpose
Turn a user's data request into something **persistent and revisitable**. Two output destinations beyond a one-time chat answer:
1. **WM custom dashboard** — native WM container with charts and sections, lives inside the platform; created via `dashboard-create`
1. **HTML artifact** — standalone HTML file with a shareable URL and downloadable file; created via `create_artifact`. Use when the WM dashboard schema can't express what the user wants (custom layouts, narrative + data, branded executive summaries, mixed visualizations).
Different from `attribution-data-query` (one-time chat answer, nothing persisted) and from `attribution-weekly-report` (recurring scheduled delivery, not a static artifact).
## 2. When to trigger
**Default behavior**: *do not* trigger this skill on its own — answer one-time questions via `attribution-data-query` first, then **at the end of the answer** offer the user the option to save it as a dashboard or artifact.
**Trigger this skill** only when the user explicitly asks for persistence, or when accepting the post-answer follow-up. Common phrasings:
- "Build me a dashboard comparing Meta vs Google vs TikTok for the last 90 days"
- "Save this analysis as a dashboard"
- "Make me a report I can send to my CMO"
- "Generate an HTML summary I can share with the team"
- "Add a CTR section to my Meta dashboard"
**Do NOT trigger** when:
- User asks a one-time question with no persistence signal → answer via `attribution-data-query`, then ask at the end if they want it saved
- User wants a recurring scheduled report → `attribution-weekly-report`
- User wants to slice by a label that needs NC config → `attribution-custom-dimension` first, then return here
**Handling the one-time-vs-persistent ambiguity**:
- If user explicitly says "dashboard", "save", "report", "share", "send to": persistent intent — trigger this skill
- If user phrases as a question ("what's my Meta ROAS?", "give me a Meta breakdown"): default to one-time chat answer; agent appends one line at the end — "Want me to save this as a dashboard or generate a shareable HTML report?"
- If neither signal: same as the question case — default one-time, follow-up at the end
## 3. Inputs

<lark-table rows="9" cols="3" column-widths="187,166,457">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Description / default**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `output_type`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      One of: **wm_dashboard** (default when persistent intent is detected) / **html_artifact** (when dashboard schema can't express the request, or user explicitly asks for HTML / shareable report / downloadable file) / **add_section** (when user wants to extend an existing dashboard). See § 4 Step 2 for the dashboard-vs-artifact decision tree.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dataset`
    </lark-td>
    <lark-td>
      Required (inferred)
    </lark-td>
    <lark-td>
      One of: `channel_attribution` / `ads_attribution` / `creative_attribution` / `order_sales`. Pick by user intent (see routing table below). When in doubt → `channel_attribution`. For multi-dataset asks: one section per dataset inside one `dashboard-create` call (dashboard path) or in one HTML document (artifact path).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `metrics`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      The numbers the user wants (ROAS, CPA, spend, revenue, attr_orders, ...). **Validate against **`**dashboard-metrics-list**`** — never invent field names.**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dimensions`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      How to break down (by channel, date, campaign, audience…). For NC-derived dimensions, use the propertyName exactly as returned (case-sensitive).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `time_range`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **Default:**`-30d`. 7d too short for trend visualization; 90d fine for longer-window asks.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `filters`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Channel restriction, campaign-name patterns, status. Operator must match the field's `filterBehavior` from metrics-list.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `name`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Propose a concise name from intent ("Meta vs Google vs TikTok · iDDA · 90d"); user can override during confirmation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution_model`
    </lark-td>
    <lark-td>
      Do not ask
    </lark-td>
    <lark-td>
      Auto-apply tenant default. If user named one explicitly, set as filter; else leave default.
    </lark-td>
  </lark-tr>
</lark-table>

**Dataset routing**:

<lark-table rows="6" cols="2" column-widths="498,240">

  <lark-tr>
    <lark-td>
      **User intent**
    </lark-td>
    <lark-td>
      **dataset**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Channel-level ROAS, spend, impressions, CPA, CVR by source
    </lark-td>
    <lark-td>
      `channel_attribution`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Ad-level metrics, campaign / ad group / ad performance
    </lark-td>
    <lark-td>
      `ads_attribution`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Creative attributes, asset-level breakdown
    </lark-td>
    <lark-td>
      `creative_attribution`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Order value, GMV, sales revenue (no channel split)
    </lark-td>
    <lark-td>
      `order_sales`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Lift test / incrementality measurement
    </lark-td>
    <lark-td>
      Route out — not this skill
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 1: Clarify (at most one round)**
Confirm only what's missing. **One question max.**
- Metrics — what numbers to show
- Dimensions — how to break it down
- Time range — default `-30d`, don't ask
- Goal — new dashboard / add section to existing / generate HTML artifact (only ask if ambiguous)
**Do not ask**: attribution model (auto-apply tenant default), chart type (recommend it), dashboard name (propose it).
**Step 2: Pick output type — dashboard vs artifact**
Default to **WM dashboard**. Fall back to **HTML artifact** only when:
- User explicitly asks for HTML / "shareable report" / "downloadable file" / "PDF" / "send to my CMO" (executive-style document)
- The layout the user describes can't be expressed by WM dashboard's chart-section schema (e.g., narrative paragraphs interleaved with charts, custom branded headers, mixed images + tables, comparison side-by-side that doesn't fit standard chart types)
- User wants to share externally without giving access to the WM platform — a standalone URL + downloadable file fits better than a WM-internal dashboard
If unclear, lean toward dashboard (cheaper to build, easier to revisit and edit). Mention the artifact option once if the user might prefer it: "I can build this as a dashboard (lives in WM, you can keep iterating on it) or as an HTML report (standalone URL, downloadable, shareable externally) — which would you prefer?"
**Step 3: Consult **`**knowledge-base-ask**`** (MANDATORY)**
Required for the `ctx` timestamp before any SQL execution. Ask about: `dashboard-create` schema patterns + dataset-specific metric/dimension conventions + artifact rendering conventions (for the HTML path).
**Step 4: Discover valid fields via **`**dashboard-metrics-list**`
Call with chosen `dataSet` and `tenantId`. Pin down:
- Exact `field` names matching the user's metrics
- Exact `field` names for dimensions
- NC propertyName for any business-label dimension (case-sensitive verbatim)
- Filter fields + each field's `filterBehavior`
**Never invent field names.** If a metric has no match, ask once with the closest 2–3 candidates.
**Step 5: Show a preview + ask for confirmation**
System-level: both `dashboard-create` and `create_artifact` are R1 (no automatic block). At the **skill level** we still surface a preview and wait for explicit user confirmation, because mis-parsed intent on a persistent artifact is more annoying to clean up than a chat error.
**Dashboard preview**:
```plaintext
**Dashboard: Meta vs Google vs TikTok · iDDA · 90d**

| Section            | Chart | Metrics       | Dimensions   | Date Range |
|--------------------|-------|---------------|--------------|------------|
| ROAS Trend         | line  | roas, spend   | date         | -90d       |
| Channel Comparison | bar   | roas, cpa     | channel      | -90d       |
| Spend Share        | pie   | spend         | channel      | -90d       |

[Confirm and create]   [Modify]   [Cancel]

```

**Artifact preview**:
```plaintext
**HTML Report: Q3 Meta Performance Summary**

Layout:
- Header: executive summary, KPI tiles
- Section 1: ROAS trend (line chart)
- Section 2: campaign-level breakdown (table)
- Section 3: takeaways + recommendations (text)

Output: shareable URL + downloadable HTML file.

[Confirm and create]   [Modify]   [Cancel]

```

One-sentence rationale per chart-type or layout choice. Don't pad.
**Chart type selection** (for dashboard path):

<lark-table rows="6" cols="2" column-widths="328,138">

  <lark-tr>
    <lark-td>
      **Use case**
    </lark-td>
    <lark-td>
      **Chart type**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Trend over time
    </lark-td>
    <lark-td>
      `line`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Comparison across categories
    </lark-td>
    <lark-td>
      `bar`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Share / proportion
    </lark-td>
    <lark-td>
      `pie`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Row-level detail / export
    </lark-td>
    <lark-td>
      `table`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Single KPI callout
    </lark-td>
    <lark-td>
      `numeric`
    </lark-td>
  </lark-tr>
</lark-table>

**Step 6: Create (after explicit confirmation)**
**Dashboard path** — single `dashboard-create` call with all sections:
```plaintext
{
  "dashboardName": "<name>",
  "dateRange": "-30d",
  "sections": [
    {
      "sectionName": "<name>",
      "chartType": "line",
      "dataSet": "channel_attribution",
      "metrics": ["roas", "spend"],
      "dimensions": ["date"]
    }
  ]
}

```

**Add-section path** — `dashboard-list` to find target `dashboardId`, then `dashboard-section-create`.
**Artifact path** — pull data via `database-query-sql`, then call `create_artifact` with the HTML body. Returned URL is shareable; file is downloadable from that URL.
**Step 7: Deliver**
One line, no pad:
- **Dashboard**: "Dashboard created: [link to dashboard]"
- **Artifact**: "Report created: [link to artifact] (also downloadable as HTML from that URL)"
Do **not** ask "want me to create another?" or "should I schedule this weekly?" — UI exposes those.
## 5. Tools used

<lark-table rows="9" cols="4" column-widths="239,206,86,207">

  <lark-tr>
    <lark-td>
      **Tool**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **System risk**
    </lark-td>
    <lark-td>
      **Purpose**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
    <lark-td>
      Required (first)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Schema patterns + `ctx` timestamp
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-metrics-list`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Validate field names + NC propertyNames. Always pass `tenantId` + `dataSet`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `database-query-sql`
    </lark-td>
    <lark-td>
      Required (artifact path)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Pull the data the artifact will embed (for the HTML path; dashboard path doesn't need it because the dashboard tool runs its own queries)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-create`
    </lark-td>
    <lark-td>
      Required (dashboard path)
    </lark-td>
    <lark-td>
      R1
    </lark-td>
    <lark-td>
      Create new dashboard with all sections in one call. System-level R1 (direct execute + audit); skill-level UX still shows preview + confirm before firing.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-list`
    </lark-td>
    <lark-td>
      Conditional (add-section)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Look up `dashboardId`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-section-create`
    </lark-td>
    <lark-td>
      Conditional (add-section)
    </lark-td>
    <lark-td>
      R1
    </lark-td>
    <lark-td>
      Add section to existing dashboard. Same skill-level confirm-before-fire convention.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-get`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Read existing dashboard config when modifying
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `create_artifact`
    </lark-td>
    <lark-td>
      Required (artifact path)
    </lark-td>
    <lark-td>
      R1
    </lark-td>
    <lark-td>
      Create HTML artifact with shareable URL + downloadable file. Same confirm-before-fire convention.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
This skill produces **three turns**:
1. **Clarification** (only if pivotal field missing — one question max)
1. **Preview + confirm** — markdown table (dashboard) or layout outline (artifact); confirm / modify / cancel; **pure block, no countdown timer**
1. **Result** — single line with the link
**What never appears**:
- Raw JSON of the create payload (internal artifact)
- Multi-question forms ("what name? what chart? what color?")
- "60-second undo" / countdown timer language (these don't exist)
- Pad-y follow-ups ("want me to also …?")
- Field-name internals (`attr_model_name`, `naming_convention.X`)
## 7. Edge cases & routing

<lark-table rows="12" cols="2" column-widths="328,410">

  <lark-tr>
    <lark-td>
      **Edge case**
    </lark-td>
    <lark-td>
      **Handling**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Save this analysis as a dashboard" — continuation from a chat query
    </lark-td>
    <lark-td>
      Inherit the prior query's metrics / dimensions / time range. Don't re-ask. Propose layout based on what was just shown.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      One-time question ambiguous — could be a chat answer or a saved dashboard
    </lark-td>
    <lark-td>
      Default to one-time chat (via `attribution-data-query`). At the end of the answer, append one line: "Want me to save this as a dashboard or generate a shareable HTML report?"
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants the report sent to their CMO
    </lark-td>
    <lark-td>
      Lean toward HTML artifact (shareable URL + downloadable file). Confirm whether they want the CMO to receive a link or a downloaded file.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Layout the user describes doesn't fit WM dashboard schema (narrative + data + branded header)
    </lark-td>
    <lark-td>
      Switch to artifact path. Surface this to the user once: "WM dashboard is best for charts in sections; for the layout you described (narrative + charts + branded), an HTML artifact fits better. Going with artifact — let me know if you'd prefer a standard dashboard instead."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Metric/dimension needs NC config
    </lark-td>
    <lark-td>
      Pause — route to `attribution-custom-dimension` to set up NC first. After config completes, return here.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Multi-dataset request
    </lark-td>
    <lark-td>
      One section per dataset in one `dashboard-create` call. Or, for artifact path, one section per dataset inside one HTML document. Don't split into multiple dashboards / artifacts.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "actually, schedule this to be sent weekly"
    </lark-td>
    <lark-td>
      Different intent — route to `attribution-weekly-report`. The dashboard/artifact you just created can be the report's source.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User wants to modify an existing dashboard heavily (rename multiple sections, change time range globally)
    </lark-td>
    <lark-td>
      Bulk edits go through `dashboard-section-create` + `dashboard-get` read-modify cycle. Show full preview before firing. If the changes are large and risky, suggest the user use UI edit mode instead — agent-driven bulk modify is harder to preview cleanly.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Metrics-list returns no match
    </lark-td>
    <lark-td>
      Ask once with closest 2–3 candidates. Don't substitute silently.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User cancels the preview
    </lark-td>
    <lark-td>
      Acknowledge in one line. Don't ask "want to try something different?" — let them re-ask.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Artifact path but the data query times out / returns empty
    </lark-td>
    <lark-td>
      Don't generate an empty HTML. Surface the issue, offer to adjust filters / time range.
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Skip the preview-and-confirm step** — even though `dashboard-create` / `create_artifact` are R1 (no system block), the skill-level convention is to show a preview and wait for user confirmation. A mis-parsed intent landing as a persistent artifact is annoying to clean up.
- **Reference "60-second undo" or any countdown timer** — these don't exist in the current system. `tool_result_undoable` is deprecated.
- **Use R2 / R3 risk language** — the current system has only R0 / R1 / R2; this skill's writes are R1.
- **Trigger this skill on every chat data question** — default to one-time answer via `attribution-data-query`; only enter this skill on explicit persistence intent or as a follow-up after asking.
- **Invent field names** — every metric and dimension must come from `dashboard-metrics-list`
- **Hard-code NC propertyNames** — pass `tenantId` and use returned propertyName verbatim
- **Ask about attribution model** — auto-apply tenant default; only set if user explicitly named one
- **Manually inject **`**attr_model_name**`** as a filter** — attribution datasets receive it automatically
- **Use **`**naming_convention.X**`** as a SQL/field prefix** — pass propertyName directly
- **Multi-question form in clarification** — one question max
- **Default to artifact when dashboard works** — dashboard is cheaper to revisit and edit; artifact is for cases the schema can't express
- **Generate empty / broken artifact** — for artifact path, run the query first; if empty, surface and adjust
- **Skip **`**knowledge-base-ask**`** before SQL**
- **Add **`**tenant_id**`** filters in SQL** — platform-mcp injects it
- **Mismatched filter operator** — `filters[].operator` must match field's `filterBehavior`
- **Pad with "want me to also...?"** at the end — UI exposes follow-ons
- **Show raw JSON of the create payload in the response** — internal artifact
- **Create multiple dashboards/artifacts when one would do** — multi-dataset asks go into one container
## 9. References & related skills
**Related skills**:
- **Sibling**: `attribution-data-query` (one-time chat answer, the default for most asks), `attribution-weekly-report` (recurring scheduled delivery)
- **Upstream**: `attribution-custom-dimension` (run first if NC config missing), `attribution-intent-clarification` (if too vague)
- **Routes out to**: `attribution-weekly-report` when user adds scheduling intent
**Risk class**: dashboard-create / dashboard-section-create / create_artifact are all **R1** at the system level — direct execute + audit log, no system-level confirm block. The skill adds a UX-level preview + confirm step (pure block, no timer) before firing, because mis-parsed intent on a persistent artifact is annoying to clean up. See the internal risk-levels reference.
**Output destinations**:

<lark-table rows="3" cols="3" column-widths="159,289,290">

  <lark-tr>
    <lark-td>
      **Destination**
    </lark-td>
    <lark-td>
      **When to choose**
    </lark-td>
    <lark-td>
      **Tool**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      WM custom dashboard
    </lark-td>
    <lark-td>
      Default for persistent intent. User wants to revisit / iterate inside the platform. Standard chart-section layout works.
    </lark-td>
    <lark-td>
      `dashboard-create` / `dashboard-section-create`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      HTML artifact
    </lark-td>
    <lark-td>
      User wants a shareable URL + downloadable file. External sharing (CMO, agency, board). Layout doesn't fit dashboard schema (narrative + branded + mixed visuals).
    </lark-td>
    <lark-td>
      `create_artifact`
    </lark-td>
  </lark-tr>
</lark-table>

**Key concepts**:
- **Atomic creation**: all sections in one `dashboard-create` call, or one HTML document for artifacts — keeps the user's mental model coherent and the audit clean.
- **Skill-level confirm**: even though the system doesn't block R1, we always preview and wait. Pure blocking, no countdown timer.
- **filterBehavior**: each field's metrics-library entry declares which operators it supports. Read this before building `filters[]`.
- **Auto-applied model filter**: attribution datasets receive an `attr_model_name` filter automatically — don't duplicate in SQL or `filters[]`.
