## Customer-facing scenario snippets

Reusable explanations for the most common root causes. Pick the one that matches — never paste two contradictory ones. If multiple causes overlap, name the dominant one first.

### Amazon Ads → non-Amazon Store

*"This is expected. Amazon Ads attribution only credits orders completed on Amazon Store. If you're looking at Shopify or another channel, Amazon Ads will always show zero — by design, not a tracking bug."*

### Spend dropped proportionally

*"Spend on [tactic] decreased [X]% over the period; attributed orders dropped about the same. This is proportional, not a performance issue — attribution is reflecting the lower investment correctly."*

### UTM tracking issue

*"We found about [X]% of clicks can't be matched to campaigns because of UTM gaps. Please review UTMs for the listed campaigns — attribution typically recovers within 1–2 weeks once fixed."*

### Click dilution (new high-volume campaigns)

*"Starting [date], [N] new campaigns generated large click volumes. Under [model], those clicks compete for credit. The new campaigns appear Reach/Traffic-optimized — more clicks, fewer conversions — so this is a click-mix shift, not a real performance decline."*

### Lift-test calibration / retroactive change

*"When a new lift test is published, iDDA retroactively updates attribution across the test's historical window. Your latest test for [platform] (completed [date]) showed lower incremental impact than before, so the model recalibrated downward. The [X → Y] change reflects a more accurate estimate of true incrementality, not a real performance drop."*

### Campaign restructure (real performance change)

*"The drop traces to a campaign restructure effective [date] — the account shifted from purchase-optimized to reach/awareness-optimized. Platform-reported orders also dropped [X]% in the same window, so it's a real performance change, not a reporting issue."*

### Share squeezed (iDDA zero-sum)

*"During [window], [other tactic]'s spend grew significantly, and iDDA allocated more credit there. This compressed [your tactic]'s share, even if its absolute contribution didn't change — that's how the zero-sum model works."*
