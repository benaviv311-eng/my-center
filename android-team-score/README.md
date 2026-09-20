# TeamScore Android

Native Android wrapper for TeamScore.

- Package: com.benaviv.teamscore
- Version: 1.0.0 (versionCode 1)
- Min SDK: 24
- Target/Compile SDK: 36
- App source URL: https://benaviv311-eng.github.io/my-center/team-score/

The GitHub Actions workflow builds:
- an installable debug APK for phone testing
- an unsigned release AAB for Play preparation

Before a production Play upload, configure a private upload signing key and build a signed release AAB. Never commit a signing key or its password to the public repository.
