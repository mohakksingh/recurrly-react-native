<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Recurrly Expo app. The following changes were made:

- **`app.config.js`** — Converted from empty to a dynamic config that extends `app.json` and exposes `posthogProjectToken` and `posthogHost` via `Constants.expoConfig.extra`. This is required for `src/config/posthog.ts` to read the token at runtime.
- **`.env`** — Added `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` with the correct project values. The PostHog client is now fully configured and active.
- **`app/(tabs)/subscriptions.tsx`** — Added `subscription_searched` event with a 500ms debounce, capturing `query_length` and `results_count` properties. Tracks search engagement without flooding the pipeline on every keystroke.
- **`app/subscriptions/[id].tsx`** — Added `subscription_viewed` event in a `useEffect` that fires when the user navigates to a subscription detail screen, capturing `subscription_id`.

The following events were already fully instrumented and were left untouched:

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User completed email signup and verification | `app/(auth)/sign-up.tsx` |
| `user_sign_up_failed` | Signup attempt failed | `app/(auth)/sign-up.tsx` |
| `user_sign_up_email_code_failed` | Sending verification email failed during signup | `app/(auth)/sign-up.tsx` |
| `user_sign_up_verification_failed` | User entered wrong verification code at signup | `app/(auth)/sign-up.tsx` |
| `user_signed_in` | User completed sign-in (including MFA) | `app/(auth)/sign-in.tsx` |
| `user_sign_in_failed` | Sign-in failed (wrong credentials or error) | `app/(auth)/sign-in.tsx` |
| `user_sign_in_verification_failed` | User entered wrong MFA/trust code at sign-in | `app/(auth)/sign-in.tsx` |
| `subscription_created` | User created a new subscription | `app/(tabs)/index.tsx` |
| `subscription_expanded` | User expanded a subscription card | `app/(tabs)/index.tsx` |
| `subscription_collapsed` | User collapsed a subscription card | `app/(tabs)/index.tsx` |
| `subscription_searched` | User typed a search query in subscriptions list | `app/(tabs)/subscriptions.tsx` |
| `subscription_viewed` | User navigated to a subscription detail screen | `app/subscriptions/[id].tsx` |
| `user_signed_out` | User signed out successfully | `app/(tabs)/settings.tsx` |

User identification (`posthog.identify`) is called at both sign-in and sign-up with the Clerk user ID as the distinct ID, and `posthog.reset()` is called on sign-out.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/370827/dashboard/1434579
- **Signup to First Subscription Funnel**: https://us.posthog.com/project/370827/insights/7I5WKGgl
- **Sign-in Success vs Failures**: https://us.posthog.com/project/370827/insights/X2KWdq6K
- **Subscriptions Created Over Time**: https://us.posthog.com/project/370827/insights/4eA3vChC
- **Subscription Search Activity**: https://us.posthog.com/project/370827/insights/qqSFtQve
- **Churn Signal: Sign-outs Over Time**: https://us.posthog.com/project/370827/insights/3qWlmzzC

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
