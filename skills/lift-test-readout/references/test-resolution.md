When the user doesn’t give an unambiguous test ID, resolve in this order:

| User says | Resolve to |
|-|-|
| “test 20260320-Meta” / explicit name | Look up exactly that test |
| “my Meta test” / “the Meta one” | Most recent **completed** Meta test for this tenant |
| “my last test” / “the latest test” | Most recent completed test, any platform |
| “my last 3 tests” / “recent tests” / “Q1 tests” | Multi-test mode (use the **multi-test** read shape from §4.1) |
| “my [partial-name] test” with multiple matches | List candidates, ask user to pick |
| Reference to a test that’s still running (“how did Meta do” but no completed Meta test exists) | Surface the running test’s status and note results aren’t ready yet — don’t fabricate a readout from partial data |
