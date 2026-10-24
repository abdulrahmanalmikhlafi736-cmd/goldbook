package com.almekhlafi.FPRO

import android.annotation.SuppressLint
import android.app.*
import android.content.Intent
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.*

/** Foreground lifetime + real WebView media controls, not a second fake player. */
class AudioPlaybackService : Service() {
    interface Controls { fun playAudio(); fun pauseAudio(); fun stopAudio() }
    companion object {
        const val STOP = "com.almekhlafi.FPRO.AUDIO_STOP"
        const val PLAY = "com.almekhlafi.FPRO.AUDIO_PLAY"
        const val PAUSE = "com.almekhlafi.FPRO.AUDIO_PAUSE"
        var controls: Controls? = null
        private var instance: AudioPlaybackService? = null
        fun updatePlaying(value: Boolean) { instance?.render(value) }
    }
    private lateinit var session: MediaSession
    private lateinit var wake: PowerManager.WakeLock
    private val handler = Handler(Looper.getMainLooper())
    private val expire = Runnable { controls?.stopAudio(); stopSelf() }
    private var playing = false
    override fun onCreate() {
        super.onCreate(); instance = this
        wake = getSystemService(PowerManager::class.java).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FPRO:audio")
        session = MediaSession(this, "FPRO audio").apply {
            setCallback(object : MediaSession.Callback() {
                override fun onPlay() { controls?.playAudio() }
                override fun onPause() { controls?.pauseAudio() }
                override fun onStop() { controls?.stopAudio(); stopSelf() }
            }); isActive = true
        }
        if(Build.VERSION.SDK_INT >= 26)getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel("audio", "تشغيل الصوت في الخلفية", NotificationManager.IMPORTANCE_LOW))
    }
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // A killed WebView cannot be restored as though it were still playing.
        if(controls == null) { stopSelf(); return START_NOT_STICKY }
        when(intent?.action) {
            STOP -> { controls?.stopAudio(); stopSelf(); return START_NOT_STICKY }
            PLAY -> controls?.playAudio()
            PAUSE -> controls?.pauseAudio()
        }
        render(intent?.getBooleanExtra("playing", playing) ?: playing)
        return START_NOT_STICKY
    }
    @SuppressLint("WakelockTimeout") // Foreground only, released on pause/stop/destroy.
    private fun render(value: Boolean) {
        playing = value; handler.removeCallbacks(expire)
        if(value) { if(!wake.isHeld)wake.acquire() } else {
            if(wake.isHeld)wake.release()
            handler.postDelayed(expire, 10 * 60 * 1000L)
        }
        session.setPlaybackState(PlaybackState.Builder().setActions(PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_STOP).setState(if(value)PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, if(value)1f else 0f).build())
        val open = PendingIntent.getActivity(this, 40, Intent(this, MainActivity::class.java).setAction(MainActivity.VIDEO_MODE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        fun action(name: String, code: Int) = PendingIntent.getService(this, code, Intent(this, AudioPlaybackService::class.java).setAction(name), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val builder = if(Build.VERSION.SDK_INT >= 26)Notification.Builder(this, "audio") else Notification.Builder(this)
        val notification = builder.setSmallIcon(R.drawable.ic_headphones).setContentTitle("FPRO — صوت الفيديو")
            .setContentText(if(value)"يعمل في الخلفية — اضغط للعودة للفيديو" else "التشغيل متوقف مؤقتًا")
            .setContentIntent(open).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(value).setDeleteIntent(action(STOP, 43))
            .addAction(Notification.Action.Builder(if(value)android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play, if(value)"إيقاف مؤقت" else "تشغيل", action(if(value)PAUSE else PLAY, 41)).build())
            .addAction(Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, "إنهاء", action(STOP, 42)).build())
            .setStyle(Notification.MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(0, 1)).build()
        startForeground(25, notification)
    }
    override fun onTaskRemoved(rootIntent: Intent?) { controls?.stopAudio(); stopSelf(); super.onTaskRemoved(rootIntent) }
    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        if(wake.isHeld)wake.release()
        session.isActive = false; session.release(); instance = null
        if(Build.VERSION.SDK_INT >= 24)stopForeground(STOP_FOREGROUND_REMOVE) else @Suppress("DEPRECATION") stopForeground(true)
        super.onDestroy()
    }
    override fun onBind(intent: Intent?) = null
}
