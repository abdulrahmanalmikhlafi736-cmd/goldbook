# Only the instrumented test harness: Error Prone's compile-time annotation
# refers to a javac enum, which is intentionally absent from Android runtime.
-dontwarn javax.lang.model.element.Modifier
