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
        val pixel = bitmap.getPixel(bitmap.width / 2, bitmap.height / 2)
        assertTrue("Compact APK must paint green pixels, not a grey screen: ${Integer.toHexString(pixel)}", Color.green(pixel) > 140 && Color.red(pixel) < 70 && Color.blue(pixel) < 120)
    }

    @Test fun realFacebookIsVisibleInCompactApp() {
        launch()
        val facebook = device.wait(Until.findObject(By.textContains("Facebook")), 40_000)
        screenshot("compact-facebook.png")
        val web = device.findObject(By.clazz("android.webkit.WebView"))
        val text = web?.let { textTree(it) } ?: "No accessible WebView"
        println("LIVE_WEB: " + text.take(1800))
        assertNotNull("Facebook content must become visible; actual accessibility text: ${text.take(1000)}", facebook)
        assertTrue("A real page must contain more than a brand name", text.length > 80)
    }
}
