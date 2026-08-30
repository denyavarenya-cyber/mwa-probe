# mwa-probe

Minimal Expo app exercising Solana Mobile Wallet Adapter on Android:
connect, sign message, read devnet balance.

Built as a measurement, not a product — the goal was to find where the
mobile integration path breaks for a newcomer. Findings are in
[friction.md](./friction.md).

## Stack
Expo SDK 54, React Native 0.81.5, @solana/web3.js,
@solana-mobile/mobile-wallet-adapter-protocol-web3js.
Tested on Windows 11, Pixel 7 emulator (API 35), fakewallet.

## Related
Issues found in the official Phantom embedded template:
solana-foundation/templates#468
