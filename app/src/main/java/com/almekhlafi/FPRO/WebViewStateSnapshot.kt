package com.almekhlafi.FPRO

import android.os.Bundle
import android.os.Parcel
import android.webkit.WebView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

/** Bounded serialised checkpoint, never a mutation of the live history/DOM. UI thread only. */
internal object WebViewStateSnapshot {
    const val MAX_BYTES = 256 * 1024
    fun capture(web: WebView): Bundle? { return try {
        val state = Bundle()
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAVE_STATE)) {
            WebViewCompat.saveState(web, state, MAX_BYTES, false)
        } else {
            // Old providers cannot trim serialisation. Avoid capturing unbounded histories.
            if (web.copyBackForwardList().size > 128) return null
            if (web.saveState(state) == null) return null
        }
        val parcel = Parcel.obtain()
        try {
            parcel.writeBundle(state)
            if (state.isEmpty || parcel.dataSize() > MAX_BYTES) null else state
        } finally { parcel.recycle() }
    } catch (_: Exception) { null } } // Losing a checkpoint must never break browsing.
}
