## 5 ambiguity types — detailed examples

| **Type** | **Example user input** | **What's ambiguous** |
|-|-|-|
| **Granularity** | "Where should I cut spend?" | channel? campaign? creative? Different answers; user has to pick the level they actually plan to act on |
| **Metric** | "Show me top performers" | by ROAS? spend? orders? new customers? "Top performer" by ROAS vs by sales gives different lists |
| **Sales-platform** | "Show me Meta ROAS" | Against which sales platform? Amazon Store / Shopify / TikTok Shop. Attribution in WM is computed **per sales platform**, so the same ads_platform × metric can have very different values depending on which sales platform is in scope. Common with ROAS, `attr_orders`, `attr_new_customer_orders`, CAC. |
| **Scope** | "How are my ads doing?" | Which channels? Which time window? Compared to what? |
| **Comparison** | "Compare last month to this month" | Which metric? Which dimension? Channel-level or campaign-level? |
| **Subject** | "Look at my best campaign" | Best by what (ROAS / sales / NC orders)? In what window? |
