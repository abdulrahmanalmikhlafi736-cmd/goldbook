-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
# The device test runner discovers this optional tracing bridge by its class name.
# Retain the bridge in optimized builds so the actual compact APK can be tested.
-keep class androidx.tracing.Trace { *; }
