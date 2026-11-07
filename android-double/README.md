# DOUBLE Android

Native Android WebView shell for DOUBLE.

- App name: DOUBLE
- Package: com.benaviv.doublegame
- Version: 1.0.0 (versionCode 1)
- Min SDK: 24
- Target/Compile SDK: 36
- Game URL: https://benaviv311-eng.github.io/my-center/double.html?v=34
- Release baseline: DOUBLE v34

The Android shell keeps the approved web game unchanged and provides:
- fullscreen immersive play
- touch input
- localStorage/DOM storage persistence
- audio playback
- portrait and landscape rotation
- Android back navigation
- external links opened outside the game

The GitHub Actions workflow builds:
- an installable debug APK for phone testing
- an unsigned release AAB for Google Play preparation

Before production upload, configure a private Play upload signing key and produce a signed release AAB.
Never commit a signing key or signing passwords to this public repository.
