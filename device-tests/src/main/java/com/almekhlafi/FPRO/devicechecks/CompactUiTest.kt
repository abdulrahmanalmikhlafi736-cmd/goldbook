package com.almekhlafi.FPRO.devicechecks

import android.graphics.BitmapFactory
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/** Black-box tests: no app classes, hooks, fake responses, or changes to app R8. */
@RunWith(AndroidJUnit4::class)
class CompactUiTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private fun launch() {
        device.executeShellCommand("am force-stop com.almekhlafi.FPRO")
        device.executeShellCommand("am start -W -n com.almekhlafi.FPRO/.MainActivity")
        assertTrue("Actual compact app must open", device.wait(Until.hasObject(By.pkg("com.almekhlafi.FPRO")), 10_000))
        Thread.sleep(2300) // custom splash, not a network wait
    }
    private fun screenshot(name: String): File {
        val file = File(instrumentation.context.getExternalFilesDir(null), name)
        assertTrue(device.takeScreenshot(file))
        return file
    }
    private fun textTree(node: UiObject2): String = (listOfNotNull(node.text, node.contentDescription) + node.children.map { textTree(it) }).joinToString(" ")

    @Test fun localPagePaintsThroughRealSettingsButton() {
        launch()
        val settings = requireNotNull(device.wait(Until.findObject(By.text("⚙")), 10_000)) { "Settings button must be accessible" }
        settings.click()
        val check = requireNotNull(device.wait(Until.findObject(By.text("اختبار عرض محلي بلا إنترنت")), 10_000)) { "Display self-test must be reachable" }
        check.click()
        assertNotNull("Local HTML must be accessible in actual WebView", device.wait(Until.findObject(By.textContains("اختبار عرض WebView")), 15_000))
        Thread.sleep(800)
        val bitmap = BitmapFactory.decodeFile(screenshot("compact-local.png").absolutePath)
        var greenSamples = 0
        for (y in 30..85 step 5) for (x in 20..80 step 10) {
            val pixel = bitmap.getPixel(bitmap.width * x / 100, bitmap.height * y / 100)
            if (Color.green(pixel) > 140 && Color.red(pixel) < 70 && Color.blue(pixel) < 120) greenSamples++
        }
        assertTrue("Compact APK must paint green pixels, not a grey screen; green samples=$greenSamples", greenSamples > 15)
    }

    @Test fun realFacebookIsVisibleInCompactApp() {
        launch()
        val deadline = android.os.SystemClock.elapsedRealtime() + 40_000
        var text = ""
        var visible = false
        while (android.os.SystemClock.elapsedRealtime() < deadline && !visible) {
            try {
                text = device.findObject(By.clazz("android.webkit.WebView"))?.let { textTree(it) } ?: ""
                visible = text.length > 80 && (text.contains("facebook", ignoreCase = true) || text.contains("فيسبوك"))
            } catch (_: androidx.test.uiautomator.StaleObjectException) { /* DOM changed; read a fresh tree. */ }
            if (!visible) Thread.sleep(1000)
        }
        val capture = screenshot("compact-facebook.png")
        val hierarchy = File(capture.parentFile, "compact-ui.xml")
        device.dumpWindowHierarchy(hierarchy)
        // AGP uninstalls the test APK and deletes its external files at teardown.
        // Persist anonymous evidence under shell-owned /data/local/tmp first.
        device.executeShellCommand("screencap -p /data/local/tmp/fpro-facebook.png")
        val encoded = android.util.Base64.encodeToString(hierarchy.readBytes(), android.util.Base64.NO_WRAP)
        device.executeShellCommand("echo $encoded | base64 -d > /data/local/tmp/fpro-ui.xml")
        println("LIVE_WEB: " + text.take(1800))
        assertTrue("Facebook must deliver visible content; actual accessibility text: ${text.take(1000)}", visible)
    }
}
