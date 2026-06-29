## The 4 boundary types — detailed

### Type A — Other WM product

**Definition**: Within the WM product family but outside attribution. The capability exists in WorkMagic, just not in this skill.

**Examples**:

- "Forecast my Meta ROAS for next quarter" → MBO
- "What's the real incremental impact of Meta?" → Lift Test (iDDA approximates this; Lift Test is the ground-truth measurement)
- "Which creative theme drives the most ROAS?" → Creative Magic (attribution can break down by creative ID; Creative Magic infers semantic attributes like theme / hook / format)
- "Should I bid higher on Meta tomorrow?" → Ads Magic / MBO (attribution is historical, not prescriptive)
- "Build me an audience to target next week" → Audience Magic

### Type B — Out-of-scope (not WM at all)

**Definition**: Not a WM product capability at all. Different tooling / methodology required.

**Examples**:

- "Show me my organic search rankings" → Google Search Console / Ahrefs / Semrush
- "How's my customer support volume trending?" → Zendesk / customer support tooling
- "What's my inventory turnover?" → ERP / NetSuite / Shopify Inventory
- "Industry benchmarks for our CAC" → no WM source (suggest comparison against own historical baseline)

### Type C — Tenant boundary

**Definition**: WM could answer in principle, but this specific tenant lacks the data — channel not integrated, data window too short, sales platform not connected.

**Examples**:

- "Show me TikTok ROAS" — when TikTok isn't integrated
- "Show me 2 years of data" — when tenant only has 6 months
- "Show me Shopify orders" — when only Amazon Store is integrated

**Required verification**: always check via `tenant-list` before declaring "not integrated".

### Type D — Data latency

**Definition**: WM has the capability and the integration, but the data isn't ready yet — recent events not yet processed (T+1 for clicks, T+2 for PPS backfill, etc.).

**Examples**:

- "What was yesterday's ROAS?" at 9am on T+1-lag data (data lands by \~2pm)
- "Why does last week's data keep changing?" — PPS backfill (this is actually `attribution-anomaly-diagnosis` territory; caught here only if misclassified)

**Required verification**: `knowledge-base-ask` the data-freshness conventions before quoting a specific time.
