# 2.18.29 evidence

Owner28 report shows JPEG accepted as a supported MIME but reason3 because the emitted URL fails HTTPS-target parsing. It does not record whether this is a blob/data URL or another invalid URL. Support the two standard local-image download forms safely without claiming that unknown distinction or weakening HTTPS host checks. Add only fixed scheme categories to any remaining diagnostic.

No third-party code adapted. Native APIs: WebViewCompat origin-restricted WebMessageListener, Android image bounds/MIME decoder, MediaStore pending image publication. Local blob payloads never leave the WebView's origin via HTTP; exact callback URI is fetched on demand, bounded and acknowledged, then validated natively. Old HTTPS/Seal behavior is not replaced.
