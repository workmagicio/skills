```
🔴 **{channel} {metric} {condition triggered}**

{Channel} {metric} = **{current_value}** (threshold: {threshold}) at {timestamp}.

WoW: {value_24h_ago} → {current_value} ({±pct}%)

[Open dashboard for {channel}]({dashboard_url})  ·  [Diagnose this drop]({anomaly_diagnosis_url})  ·  [Snooze / edit alert]({task_url})

```

**Rules for Heartbeat alerts**:

- **One line summary + 3 links** — never dump the full weekly layout
- Use 🔴 for threshold-breach alerts; 🟡 for "watch" notifications; 🟢 only for "back to healthy" follow-ups
- WoW comparison is optional but useful when the alert fires on a delta-based condition
- The "Diagnose this drop" link must point to `attribution-anomaly-diagnosis` — that's the natural next click
- "Snooze / edit alert" link must be functional; users adjust thresholds 5-10x for every alert that fires
