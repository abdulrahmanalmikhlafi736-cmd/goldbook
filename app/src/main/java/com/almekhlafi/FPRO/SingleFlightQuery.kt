package com.almekhlafi.FPRO

/** UI-thread backpressure for background evaluateJavascript queries.
 * Never retry/timeout an unanswered renderer by adding another queued query.
 * Navigation invalidates tickets so an old result cannot update a new page.
 */
internal class SingleFlightQuery {
    private var generation=0L
    private var pending: Long?=null
    fun begin(): Long? {
        if(pending!=null)return null
        return (++generation).also { pending=it }
    }
    fun complete(ticket: Long): Boolean {
        if(pending!=ticket)return false
        pending=null
        return true
    }
    fun invalidate() { generation++;pending=null }
}
