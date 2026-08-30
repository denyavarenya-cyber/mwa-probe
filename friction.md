# friction.md — MWA Probe (Expo SDK 54 / RN 0.81.5 / Android)

Формат запису:

```
## <Крок>
- Очікував:
- Отримав:
- Версії:
- Час:
- Джерело:
```

Оточення: Windows 11, Node 24.13.0, JDK 17 (Temurin 17.0.20.1), Expo SDK 54,
RN 0.81.5, емулятор Pixel_7 API 35 (Google APIs), Gradle 9.7.0 (у клоні MWA).

---

## Збірка fakewallet (.\gradlew :fakewallet:installLegacyDebug)
- Статус: ✅ вирішено 2026-08-30. BUILD SUCCESSFUL (5с, 75/76 задач up-to-date —
  основну компіляцію зробив попередній прогін), пакет
  `com.solana.mobilewalletadapter.fakewallet` встановлено на emulator-5554.
- Примітка: fakewallet вимагає compileSdk 37 та Gradle 9.7.0 → JDK 17+ обов'язковий.

## Перший getBalance після authorize — TypeError: Network request failed
- Крок: Connect → authorize у fakewallet → `new Connection(clusterApiUrl('devnet'))`
  → `getBalance(pk)` одразу після повернення з активності гаманця.
- Очікував: баланс акаунта з devnet RPC.
- Отримав: `failed to get balance of account …: TypeError: Network request failed`.
  Відтворилось двічі поспіль (15:45 і 15:46). При цьому мережа емулятора жива:
  ping 8.8.8.8 і api.devnet.solana.com із shell проходив (RTT ~410–450 мс),
  а діагностичний чистий `fetch` із самого застосунку повернув
  google 204 / devnet GET /health 200 / devnet POST getVersion 200.
  Після цього «прогріву» той самий Connect+getBalance пройшов успішно
  (balance: 0 lamports). Схоже на флейк холодного TLS/DNS у мережевому стеку
  емулятора при першому https-запиті застосунку, а не на проблему web3.js чи MWA.
- Обхід: ретрай запиту балансу (1–2 повтори) або попередній «warm-up» fetch.
- Версії: @solana/web3.js 1.98.4, RN 0.81.5, Expo SDK 54, емулятор API 35.
- Час: 2026-08-30 ~15:45–15:49, ~15 хв на діагностику.
- Джерело: немає (у доках RN Networking та web3.js цей флейк не описаний).

## Fast Refresh не підхопив зміну App.tsx
- Крок: правка App.tsx при запущеному Metro (порт 8081, окремий процес).
- Очікував: Fast Refresh оновить UI.
- Отримав: UI не змінився; допоміг лише force-stop + холодний старт активності
  (застосунок перезавантажив бандл із Metro).
- Версії: Expo SDK 54, RN 0.81.5.
- Час: 2026-08-30 15:47, ~2 хв.
- Джерело: немає.

## expo start у неінтерактивному режимі при зайнятому порту 8081
- Крок: `npx expo start --port 8081`, коли Metro уже працював.
- Очікував: повідомлення «port busy» і вихід або авто-вибір порту.
- Отримав: інтерактивний промпт «Use port 8082 instead?» → у неінтерактивному
  режимі exit code 1 («Skipping dev server»). Не блокер: наявний Metro на 8081
  обслуговує проєкт (перевірка: GET /status → `packager-status:running`).
- Версії: Expo SDK 54 (expo ~54.0.36).
- Час: 2026-08-30 15:44, <1 хв.
- Джерело: немає.

---

## Результат проби (2026-08-30)
Повний ланцюжок на емуляторі пройдено: Connect → authorize у fakewallet (legacy)
→ адреса → getBalance(devnet) = 0 lamports → signMessages → підпис отримано.
Нотатки:
- Статус «Verification failed» на екрані AUTHORIZE DAPP — очікувано: fakewallet
  перевіряє Digital Asset Links для identity.uri (https://example.com їх не має);
  авторизацію це не блокує.
- ECONNREFUSED-ретраї `MobileWalletAdapterWebSocket` у logcat перед з'єднанням —
  штатна поведінка local association (dapp пробує ws://127.0.0.1:<port>, доки
  гаманець не підніме сервер), описано у спеці MWA:
  https://solana-mobile.github.io/mobile-wallet-adapter/spec/spec.html
- Адреса з `authorize` приходить у base64 → декодування через
  `new PublicKey(Buffer.from(address, 'base64'))` працює коректно.
