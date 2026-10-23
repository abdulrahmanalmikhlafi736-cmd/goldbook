plugins {
    id("com.android.test")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.almekhlafi.FPRO.devicechecks"
    compileSdk = 35
    defaultConfig {
        minSdk = 23
        targetSdk = 35
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    targetProjectPath = ":app"
    // Run in our own process: the production app remains genuinely obfuscated.
    experimentalProperties["android.experimental.self-instrumenting"] = true
    buildTypes.create("compact") {
        isDebuggable = true
        matchingFallbacks += listOf("compact")
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    // This independent harness does not link against the app's optimized Kotlin/
    // AndroidX classes. It interacts only through platform Activity/View APIs.
    implementation("androidx.test:runner:1.6.2")
    implementation("androidx.test.ext:junit:1.2.1")
    implementation("androidx.test.uiautomator:uiautomator:2.3.0")
    implementation("androidx.tracing:tracing:1.2.0")
}
