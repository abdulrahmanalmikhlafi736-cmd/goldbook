# These rules apply ONLY to the androidTest harness, never to the application.
# Keep JUnit/AndroidX runner reflection intact while testing the optimized APK.
-dontshrink
-dontoptimize
-dontobfuscate
# AndroidX test references optional legacy test APIs absent on recent SDKs.
# Required runtime dependencies are still exercised by connected tests.
-ignorewarnings
