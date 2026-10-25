package com.almekhlafi.FPRO

import android.app.Notification
import android.app.NotificationManager
import android.content.Intent
import android.media.session.MediaController
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.SystemClock
import androidx.core.content.ContextCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.atomic.AtomicInteger

/** Real service/notification transport regression, not a claim of decoded audio.
 * The owner deliberately emits no playback events: commands must not reuse stale state.
 * Real decoded playback is covered separately by WebViewRenderingTest.
 */
@RunWith(AndroidJUnit4::class)
class AudioPlaybackServiceTest {
    @Test fun transportCommandsDoNotNeedPlaybackEventsToUpdateNotification() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        if (Build.VERSION.SDK_INT >= 33) {
            instrumentation.uiAutomation.executeShellCommand("pm grant ${context.packageName} android.permission.POST_NOTIFICATIONS").use {
                java.io.FileInputStream(it.fileDescriptor).use { stream -> stream.readBytes() }
            }
        }
        val plays = AtomicInteger()
        val pauses = AtomicInteger()
        val owner = object : AudioPlaybackService.Controls {
            override fun playAudio() { plays.incrementAndGet() }
            override fun pauseAudio() { pauses.incrementAndGet() }
            override fun stopAudio() {}
        }
        val notifications = context.getSystemService(NotificationManager::class.java)
        fun notice(): Notification? = notifications.activeNotifications.firstOrNull { it.id == 25 }?.notification
        fun await(description: String, predicate: () -> Boolean) {
            val deadline = SystemClock.uptimeMillis() + 5000
            while (!predicate() && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(50)
            assertTrue(description, predicate())
        }
        ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use { scenario ->
            scenario.onActivity {
                AudioPlaybackService.controls = owner
                ContextCompat.startForegroundService(context, Intent(context, AudioPlaybackService::class.java).putExtra("playing", true))
            }
            try {
                await("Initial notification must offer Pause") { notice()?.actions?.firstOrNull()?.title?.toString() == "إيقاف مؤقت" }
                notice()!!.actions.first().actionIntent.send()
                await("Pause PendingIntent must immediately offer Play without a page event") {
                    pauses.get() == 1 && notice()?.actions?.firstOrNull()?.title?.toString() == "تشغيل"
                }
                notice()!!.actions.first().actionIntent.send()
                await("Play PendingIntent must immediately offer Pause without a page event") {
                    plays.get() == 1 && notice()?.actions?.firstOrNull()?.title?.toString() == "إيقاف مؤقت"
                }
                @Suppress("DEPRECATION")
                val token = requireNotNull(notice()!!.extras.getParcelable<MediaSession.Token>(Notification.EXTRA_MEDIA_SESSION))
                val controller = MediaController(context, token)
                controller.transportControls.pause()
                await("MediaSession Pause must update both state and notification") {
                    pauses.get() == 2 && controller.playbackState?.state == PlaybackState.STATE_PAUSED && notice()?.actions?.firstOrNull()?.title?.toString() == "تشغيل"
                }
                controller.transportControls.play()
                await("MediaSession Play must update both state and notification") {
                    plays.get() == 2 && controller.playbackState?.state == PlaybackState.STATE_PLAYING
                }
                instrumentation.runOnMainSync { AudioPlaybackService.updatePlaying(false) }
                await("Actual failed/paused playback must override requested Play") {
                    controller.playbackState?.state == PlaybackState.STATE_PAUSED && notice()?.actions?.firstOrNull()?.title?.toString() == "تشغيل"
                }
                notice()!!.actions.last().actionIntent.send()
                await("Stop must remove the notification") { notice() == null }
            } finally {
                instrumentation.runOnMainSync {
                    context.stopService(Intent(context, AudioPlaybackService::class.java))
                    if (AudioPlaybackService.controls === owner) AudioPlaybackService.controls = null
                }
            }
        }
    }
}
