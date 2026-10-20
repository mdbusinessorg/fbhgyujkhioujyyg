# MÔ SALO — App Móvel (iOS + Android)

App nativo (Capacitor) que carrega o site **https://mosalo.eu.cc** dentro de um WebView nativo.
O app é 100% igual ao site — mesma base de dados (Supabase), mesmo login, mesmas funcionalidades.
**Nada foi alterado no Supabase.** Qualquer atualização feita no site aparece automaticamente no app, sem precisar publicar nova versão nas lojas.

## Estrutura

- `capacitor.config.json` — configuração (aponta para https://mosalo.eu.cc)
- `android/` — projeto Android nativo (Android Studio / Gradle)
- `ios/` — projeto iOS nativo (Xcode)
- `www/` — página de fallback offline

## Android — gerar APK

Requisitos: Node.js, JDK 17, Android SDK (platform 34).

```bash
cd mobile
npm install
cd android
./gradlew assembleDebug        # APK de teste: app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease        # AAB para a Google Play (precisa de keystore de assinatura)
```

Para publicar na Google Play é necessário criar um keystore e configurar a assinatura em `android/app/build.gradle`.

## iOS — compilar (precisa de um Mac com Xcode)

```bash
cd mobile
npm install
npx cap sync ios
npx cap open ios   # abre o Xcode
```

No Xcode: escolher a equipa de assinatura (Apple Developer account) e Product → Archive para enviar à App Store.

## Atualizar configuração

Depois de alterar `capacitor.config.json`:

```bash
npx cap sync
```
