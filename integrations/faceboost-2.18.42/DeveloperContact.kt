package com.almekhlafi.materialbook.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.almekhlafi.materialbook.R

/** Explicit external contact only; never opens WhatsApp inside Facebook's WebView. */
object DeveloperContact {
    const val PHONE = "967781764759"
    fun intents(): List<Intent> = listOf(
        Intent(Intent.ACTION_VIEW, Uri.parse("whatsapp://send?phone=$PHONE")).setPackage("com.whatsapp"),
        Intent(Intent.ACTION_VIEW, Uri.parse("whatsapp://send?phone=$PHONE")).setPackage("com.whatsapp.w4b"),
        Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$PHONE"))
    ).map { it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }

    fun open(context: Context) {
        for (intent in intents()) {
            try { context.startActivity(intent); return }
            catch (_: android.content.ActivityNotFoundException) { /* Try Business, then HTTPS. */ }
            catch (_: SecurityException) { /* A disabled/restricted handler must not crash settings. */ }
        }
        Toast.makeText(context, R.string.fpro_developer_contact_unavailable, Toast.LENGTH_LONG).show()
    }
}
