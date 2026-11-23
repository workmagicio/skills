# Reconciliation

§1 and §2: MBO isn't comparable with the attribution dashboard or with lift tests. Explain what each figure rests on; don't reconcile the numbers or show a gap.

§3: align → explain the methodological difference → show the gap. Neither figure is universally "right".

## §1 MBO vs Attribution Dashboard

|  | MBO | Attribution |
|---|---|---|
| Answers | Where the next dollar goes best, for a planned spend level and window | Who got credit for past sales |
| Nature | Model projection (MMM), forward-looking | Realized history through an attribution model and window |
| Typical figure | Projected sales, average ROAS at scenario spend, marginal ROAS | Attributed sales and ROAS |

Don't align or reconcile the two, and don't show a gap: explain which data each rests on (below). If the client quotes a dashboard figure, say which sales scope and window it covers. Attribution figures come from database-query-run on the production platform MCP with attr_model_name set — never computed.

**How media projections are anchored. **MBO doesn't scale to the reference period's attribution. By default it uses the average attribution performance since the client's most recent lift test: an average expectation for the future, with no calibration to the reference period. Whatever reference period is chosen, the model projects the same media outcome for the same spend level. So MBO channel ROAS needn't match the dashboard for the reference period, and the two aren't comparable: MBO rests on average attribution performance since the latest lift test, the dashboard shows the latest performance. Don't reconcile the numbers; explain that difference instead.

## §2 MBO vs lift tests

MBO and lift-test figures aren't comparable. Treat this like §1: explain what each figure rests on, without reconciling numbers or showing a gap. Keep three numbers separate: **lift-test incremental ROAS** over the tested spend band and window (from lift-test-readout, always with confidence score and significance); **MBO channel average ROAS** at the scenario spend level; **MBO marginal ROAS** at a point on the curve. They differ because spend bands, levels and windows differ. Confirm the calibration was applied to this model (calibration tag, lift-test-get, modelRefreshDate after the calibration) before attributing a curve change to a test.

## §3 MBO vs actual results or earlier runs

Compare in order: scope, dates, actual vs planned spend, constraints, data freshness, model version (modelRefreshDate), calibration changes.

**Earlier run, both saved** → budget-optimizer-compare, then each scenario's inputs from budget-optimizer-list. Names not IDs; "$50k → $80k (+60%)"; no winner unless asked.

**Actual results** → the forecast was conditional on its inputs. If actual spend differed from plan, say so before comparing outcomes.

Don't assign the difference to one cause without checking it; nothing confirmed → escalate.
