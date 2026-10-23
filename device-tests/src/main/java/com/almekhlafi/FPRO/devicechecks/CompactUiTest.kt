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
    // UI Automator can retain the previous force-stopped window/IME tree on
    // API 35/36. Query a fresh accessibility snapshot while the page bootstraps.
    private fun waitObject(selector: androidx.test.uiautomator.BySelector, timeout: Long): UiObject2? {
        val end = android.os.SystemClock.elapsedRealtime() + timeout
        do {
            if (android.os.Build.VERSION.SDK_INT >= 33) instrumentation.uiAutomation.clearCache()
            try { device.findObject(selector)?.let { return it } } catch (_: androidx.test.uiautomator.StaleObjectException) { }
            Thread.sleep(250)
        } while (android.os.SystemClock.elapsedRealtime() < end)
        return null
    }

    private fun launch() {
        device.executeShellCommand("am force-stop com.almekhlafi.FPRO")
        device.executeShellCommand("am start -W -n com.almekhlafi.FPRO/.MainActivity")
        assertTrue("Actual compact app must open", waitObject(By.pkg("com.almekhlafi.FPRO"), 30_000) != null)
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
        val settings = requireNotNull(waitObject(By.desc("الإعدادات"), 30_000)) { "Settings button must be accessible" }
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
        val input = device.wait(Until.findObject(By.clazz("android.widget.EditText")), 5000)
        assertNotNull("Real Facebook login input must be interactive", input)
        input!!.click()
        assertTrue("Touch must reach Facebook through the transparent controls layer",
            device.wait(Until.hasObject(By.clazz("android.widget.EditText").focused(true)), 5000))
        // No account data is entered and no login request is submitted.
    }
    private fun <T> freshUi(action: () -> T): T {
        var last: androidx.test.uiautomator.StaleObjectException? = null
        repeat(5) {
            try { return action() } catch (error: androidx.test.uiautomator.StaleObjectException) {
                last = error
                Thread.sleep(250)
            }
        }
        throw requireNotNull(last)
    }

    private fun scrollToText(text: String): UiObject2 {
        val selector = if (text.startsWith("اللون:")) By.textContains("اللون:") else By.text(text)
        repeat(18) {
            val node = freshUi { device.findObject(selector)?.takeIf { !it.visibleBounds.isEmpty } }
            if (node != null) return node
            // Use the visible native settings viewport, not a possibly retained
            // scrollable WebView node behind the Compose settings overlay.
            device.swipe(device.displayWidth/2, device.displayHeight*3/4,
                device.displayWidth/2, device.displayHeight*11/20, 75)
            Thread.sleep(500)
        }
        device.executeShellCommand("screencap -p /data/local/tmp/fpro-tools.png")
        val visible = device.findObjects(By.text(java.util.regex.Pattern.compile(".+"))).joinToString(" | ") { try { it.text.orEmpty() } catch (_: androidx.test.uiautomator.StaleObjectException) { "[updated node]" } }
        throw AssertionError("Setting not found: $text; visible: " + visible.take(2200))
    }

    @Test fun selectedPageToolsAffectRealFacebook() {
        launch()
        assertNotNull(device.wait(Until.findObject(By.clazz("android.widget.EditText")), 40_000))
        requireNotNull(waitObject(By.desc("الإعدادات"), 30_000)) { "Home gear must appear after the page is recognized" }.click()
        scrollToText("اللون: تلقائي")
        freshUi { requireNotNull(device.findObject(By.textContains("اللون:"))).click() }
        assertNotNull(device.wait(Until.findObject(By.text("ذهبي")), 5000))
        freshUi { requireNotNull(device.findObject(By.text("ذهبي"))).click() }
        scrollToText("إخفاء شريط فتح التطبيق أو تثبيته")
        freshUi {
            val y = requireNotNull(device.findObject(By.text("إخفاء شريط فتح التطبيق أو تثبيته"))).visibleBounds.centerY()
            val toggle = requireNotNull(device.findObjects(By.checkable(true)).minByOrNull {
                kotlin.math.abs(it.visibleBounds.centerY() - y)
            }) { "Banner switch must be accessible" }
            if (!toggle.isChecked) toggle.click()
        }
        device.pressBack()
        assertNotNull("Enhancements must preserve the real login form", device.wait(Until.findObject(By.text("Log in")), 15_000))
        Thread.sleep(1200)
        val bounds = freshUi { requireNotNull(device.findObject(By.text("Log in"))).visibleBounds }
        val image = BitmapFactory.decodeFile(screenshot("compact-gold-tools.png").absolutePath)
        // Sample away from the white button text, within the actual native web button.
        val goldSamples = (1..9).count { fraction ->
            val pixel = image.getPixel(bounds.left + bounds.width()*fraction/10, bounds.centerY())
            Color.red(pixel) > 150 && Color.green(pixel) > 100 && Color.blue(pixel) < 120
        }
        assertTrue("Selected gold must recolor Facebook, not only native settings; samples=$goldSamples", goldSamples >= 2)
        val text = freshUi { device.findObject(By.clazz("android.webkit.WebView"))?.let { textTree(it) }.orEmpty() }
        assertFalse("Install/open-app banner must disappear", text.contains("Get Facebook for Android", ignoreCase=true))
        assertNotNull("Login inputs remain accessible after hiding banner", device.findObject(By.clazz("android.widget.EditText")))
        device.executeShellCommand("screencap -p /data/local/tmp/fpro-tools.png")
    }

}
