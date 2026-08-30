# friction.md — MWA Probe (Expo SDK 54 / RN 0.81.5 / Android)

Entry format:

```
## <Step>
- Expected:
- Actual:
- Versions:
- Time:
- Source:
```

Environment: Windows 11, Node 24.13.0, JDK 17 (Temurin 17.0.20.1), Expo SDK 54,
RN 0.81.5, Pixel_7 emulator API 35 (Google APIs), Gradle 9.7.0 (in the MWA clone).

---

## Building fakewallet (.\gradlew :fakewallet:installLegacyDebug)
- Step: `.\gradlew :fakewallet:installDebug` as a first attempt.
- Expected: the debug build to install on the running emulator.
- Actual: `Cannot locate tasks that match ':fakewallet:installDebug' as task
  'installDebug' is ambiguous in project ':fakewallet'. Candidates are:
  'installLegacyDebug', 'installLegacyDebugAndroidTest'.` Using
  `installLegacyDebug` succeeded: BUILD SUCCESSFUL (5s, 75/76 tasks up-to-date —
  the actual compilation happened on an earlier run), package
  `com.solana.mobilewalletadapter.fakewallet` installed on emulator-5554.
- Note: fakewallet requires compileSdk 37 and Gradle 9.7.0, so JDK 17+ is mandatory.
- Versions: mobile-wallet-adapter @ HEAD 2026-08-30, Gradle 9.7.0, JDK 17.0.20.1.
- Time: 2026-08-30.

## First getBalance after authorize — TypeError: Network request failed
- Step: Connect → authorize in fakewallet → `new Connection(clusterApiUrl('devnet'))`
  → `getBalance(pk)` immediately after returning from the wallet activity.
- Expected: the account balance from the devnet RPC.
- Actual: `failed to get balance of account …: TypeError: Network request failed`.
  Reproduced twice in a row (15:45 and 15:46). Emulator networking was fine:
  ping to 8.8.8.8 and api.devnet.solana.com from the shell worked (RTT ~410–450 ms),
  and a plain diagnostic `fetch` from inside the app returned
  google 204 / devnet GET /health 200 / devnet POST getVersion 200.
  After that warm-up the same Connect+getBalance succeeded (balance: 0 lamports).
  Looks like a cold TLS/DNS flake in the emulator network stack on the app's first
  https request, not a web3.js or MWA problem.
- Workaround: retry the balance request once or twice, or issue a warm-up fetch first.
- Versions: @solana/web3.js 1.98.4, RN 0.81.5, Expo SDK 54, emulator API 35.
- Time: 2026-08-30 ~15:45–15:49, ~15 min of diagnosis.
- Source: none (not described in RN Networking docs or web3.js docs).

## Fast Refresh did not pick up a change to App.tsx
- Step: edited App.tsx with Metro running (port 8081, separate process).
- Expected: Fast Refresh updates the UI.
- Actual: the UI did not change; only a force-stop plus a cold start of the
  activity helped (the app then reloaded the bundle from Metro).
- Versions: Expo SDK 54, RN 0.81.5.
- Time: 2026-08-30 15:47, ~2 min.
- Source: none.

## expo start in non-interactive mode with port 8081 already in use
- Step: `npx expo start --port 8081` while Metro was already running.
- Expected: a "port busy" message and either an exit or automatic port selection.
- Actual: an interactive prompt "Use port 8082 instead?" → in non-interactive mode
  this becomes exit code 1 ("Skipping dev server"). Not a blocker: the existing
  Metro instance on 8081 serves the project (checked with GET /status →
  `packager-status:running`).
- Versions: Expo SDK 54 (expo ~54.0.36).
- Time: 2026-08-30 15:44, <1 min.
- Source: none.

---

## Probe result (2026-08-30)
The full chain works on the emulator: Connect → authorize in fakewallet (legacy)
→ address → getBalance(devnet) = 0 lamports → signMessages → signature returned.

Notes:
- The "Verification failed" status on the AUTHORIZE DAPP screen is expected:
  fakewallet checks Digital Asset Links for identity.uri, and https://example.com
  has none. It does not block authorization.
- ECONNREFUSED retries from `MobileWalletAdapterWebSocket` in logcat before the
  connection is established are normal local association behaviour — the dapp
  keeps trying ws://127.0.0.1:<port> until the wallet brings the server up.
  Described in the MWA spec:
  https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html
- The address returned by `authorize` is base64, so decoding via
  `new PublicKey(Buffer.from(address, 'base64'))` is the correct path.