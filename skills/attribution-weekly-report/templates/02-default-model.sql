-- Part 0 — resolve the tenant's default attribution model at load time.
-- The board runs this FIRST and feeds the result into every other query, so the
-- numbers always agree with the rest of WorkMagic. Never hardcode the model.
-- Fill: nothing.
-- Tenant isolation is injected by the query tool — do NOT add a tenant_id filter.

SELECT default_attr_model
FROM dws_view_copilot_default_attr_model_latest
LIMIT 1
