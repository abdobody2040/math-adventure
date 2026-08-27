# Deferred Work and Validation Boundaries

Math Adventure's local and public-route hardening is implemented and validated without creating synthetic child records. The remaining open items are intentionally separated by the evidence they require.

| Area | Current state | Required next evidence |
|---|---|---|
| Signed-in child, parent, and admin acceptance | Protected procedures and regression tests exist; no live acceptance is claimed. | A real parent session with an existing parent-owned child profile. |
| Mobile onboarding visual acceptance | The narrow-phone CSS now keeps the hero artwork in normal flow and a regression test covers the rule. | A signed-in or onboarding browser pass against the supplied reference flow. |
| Offline answer reconnect | Queue, idempotency, duplicate prevention, and rejected-operation feedback are implemented and unit-tested. | A real child session taken offline and reconnected in a browser. |
| Adaptive snapshot persistence | Server-owned selection and injected data-path tests exist. | A live protected next-question flow proving persisted snapshots affect the selected activity and difficulty. |
| Parent reminders | Preference controls exist, but no owner-only notification channel is used for parent messaging. | A safe app-user delivery provider or an explicitly approved integration. |
| Premium tutor and subscriptions | Safe tutor hints and guardrails exist; premium entitlement is not claimed. | Eligible payment-provider credentials and entitlement setup. |

The public browser checks confirm the English landing page, Arabic RTL toggle, localized language-button accessible name, active static service-worker cache, and absence of fresh public console or network failures. These checks do not substitute for the protected acceptance items above.
