# Android Client (Kotlin + Jetpack Compose)

Starter mobile app for the fintech project. This client is intentionally minimal so the team can implement features in short iterations.

## Current status

- Kotlin + Compose project scaffold
- Navigation with two screens:
  - Login
  - Home
- Basic auth/network foundation:
  - Token store (DataStore)
  - Auth interceptor for Bearer token

## Open in Android Studio

1. Open Android Studio
2. Choose `Open`
3. Select folder: `android-client`
4. Let Gradle sync finish
5. Run app on emulator/device

## Suggested next tasks

1. Replace fake login action with real API call
2. Add ViewModel + Repository for auth flow
3. Add transaction list screen
4. Add create transaction screen
5. Add budget progress screen
6. Connect push notification and OCR upload flows

## Package structure

- `com.group6.fintechapp`
  - `core/auth` token storage
  - `core/network` retrofit/okhttp support
  - `feature/auth` login UI
  - `feature/home` home UI

## Notes

- Backend-heavy logic (auth rules, OCR, reporting, event processing) should stay on server.
- Mobile should focus on UI, state, local cache, and API consumption.
