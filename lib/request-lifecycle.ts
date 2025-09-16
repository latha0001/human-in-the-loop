import { database, type HelpRequest } from "./database"

export interface LifecycleEvent {
  id: string
  requestId: string
  type: "created" | "escalated" | "responded" | "timeout" | "resolved"
  timestamp: Date
  details?: string
}
export interface RequestMetrics {
  averageResponseTime: number
  timeoutRate: number
  resolutionRate: number
  totalRequests: number
  pendingRequests: number
}
class RequestLifecycleManager {
  private events: Map<string, LifecycleEvent[]> = new Map()
  private timeoutHandlers: Map<string, NodeJS.Timeout> = new Map()
  private listeners: ((event: LifecycleEvent) => void)[] = []
  constructor() { this.startPeriodicCleanup()}
  async createHelpRequest(callSessionId: string, question: string, customerPhone: string): Promise<HelpRequest> {
    const request = await database.createHelpRequest({ callSessionId, question, customerPhone, status: "pending", createdAt: new Date(),})
    await this.logEvent(request.id, "created", "Help request created and escalated to supervisor")
    this.scheduleTimeout(request.id)
    this.notifySupervisor(request)
    console.log(`[Lifecycle] Created help request ${request.id} with 30-minute timeout`)
    return request
  }
  async handleSupervisorResponse(requestId: string, response: string): Promise<void> {
    const request = await database.getHelpRequest(requestId)
    if (!request || request.status !== "pending") {
      throw new Error(`Invalid request ${requestId} or already resolved`)
    }
    this.clearTimeout(requestId)
    const updatedRequest = await database.resolveHelpRequest(requestId, response)
    if (!updatedRequest) {
      throw new Error(`Failed to resolve request ${requestId}`)
    }
    await this.logEvent(requestId, "responded", `Supervisor provided response: ${response.substring(0, 50)}...`)
    await this.followUpWithCustomer(updatedRequest)
    await this.updateKnowledgeBase(updatedRequest)
    await this.logEvent(requestId, "resolved", "Request resolved and customer notified")
    console.log(`[Lifecycle] Resolved request ${requestId} and updated knowledge base`)
  }
  private async handleTimeout(requestId: string): Promise<void> {
    const request = await database.getHelpRequest(requestId)
    if (!request || request.status !== "pending") {
      return 
    }
    await database.updateHelpRequest(requestId, { status: "timeout", resolvedAt: new Date(),})
    await this.logEvent(requestId, "timeout", "Request timed out after 30 minutes without supervisor response")
    await this.notifyCustomerTimeout(request)
    console.log(`[Lifecycle] Request ${requestId} timed out after 30 minutes`)
  }
  private scheduleTimeout(requestId: string): void {
    const timeoutHandler = setTimeout(
      () => {
        this.handleTimeout(requestId)
      },
      30 * 60 * 1000, 
    )
    this.timeoutHandlers.set(requestId, timeoutHandler)
  }
  private clearTimeout(requestId: string): void {
    const handler = this.timeoutHandlers.get(requestId)
    if (handler) {
      clearTimeout(handler)
      this.timeoutHandlers.delete(requestId)
    }
  }
  private async followUpWithCustomer(request: HelpRequest): Promise<void> {
    if (!request.supervisorResponse) return
    console.log(`[Customer Follow-up] Texting ${request.customerPhone}:`)
    console.log(`"Hi! I have an answer to your question: '${request.question}'`)
    console.log(`${request.supervisorResponse}`)
    console.log(`Thank you for calling Bella's Beauty Salon!"`)
  }
  private async updateKnowledgeBase(request: HelpRequest): Promise<void> {
    if (!request.supervisorResponse) return
    const tags = this.extractTags(request.question)
    await database.addKnowledgeEntry({ question: request.question, answer: request.supervisorResponse, tags,})
    console.log(`[Knowledge Base] Added new entry: "${request.question}" -> "${request.supervisorResponse}"`)
  }
  private extractTags(question: string): string[] {
    const lowerQuestion = question.toLowerCase()
    const tags: string[] = []
    if (lowerQuestion.includes("haircut") || lowerQuestion.includes("hair")) tags.push("haircut")
    if (lowerQuestion.includes("color") || lowerQuestion.includes("highlight")) tags.push("coloring")
    if (lowerQuestion.includes("manicure") || lowerQuestion.includes("nail")) tags.push("manicure")
    if (lowerQuestion.includes("pedicure") || lowerQuestion.includes("feet")) tags.push("pedicure")
    if (lowerQuestion.includes("facial") || lowerQuestion.includes("skin")) tags.push("facial")
    if (lowerQuestion.includes("price") || lowerQuestion.includes("cost") || lowerQuestion.includes("$")) tags.push("pricing")
    if (lowerQuestion.includes("hour") || lowerQuestion.includes("time") || lowerQuestion.includes("open")) tags.push("hours")
    if (lowerQuestion.includes("book") || lowerQuestion.includes("appointment")) tags.push("booking")
    if (lowerQuestion.includes("location") || lowerQuestion.includes("address") || lowerQuestion.includes("where")) tags.push("location")
    if (lowerQuestion.includes("cancel") || lowerQuestion.includes("policy")) tags.push("policy")
    if (lowerQuestion.includes("wedding") || lowerQuestion.includes("event")) tags.push("special-events")
    return tags.length > 0 ? tags : ["general"]
  }
  private notifySupervisor(request: HelpRequest): void {
    console.log(`[Supervisor Notification] 📱 New help request from ${request.customerPhone}:`)
    console.log(`"${request.question}"`)
    console.log(`Request ID: ${request.id}`)
    console.log(`Timeout: ${new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString()}`)
  }
  private async notifyCustomerTimeout(request: HelpRequest): Promise<void> {
    console.log(`[Customer Timeout] Texting ${request.customerPhone}:`)
    console.log(`"Hi! We're still working on your question: '${request.question}'`)
    console.log(`Our team will get back to you as soon as possible. Thank you for your patience!"`)
  }
  private async logEvent(requestId: string, type: LifecycleEvent["type"], details?: string): Promise<void> {
    const event: LifecycleEvent = { id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, requestId, type, timestamp: new Date(), details,}
    const existingEvents = this.events.get(requestId) || []
    existingEvents.push(event)
    this.events.set(requestId, existingEvents)
    this.listeners.forEach((listener) => listener(event))
    console.log(`[Lifecycle Event] ${type.toUpperCase()}: ${requestId} - ${details || "No details"}`)
  }
  getRequestEvents(requestId: string): LifecycleEvent[] {
    return this.events.get(requestId) || []
  }
  getAllEvents(): LifecycleEvent[] {
    return Array.from(this.events.values())
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
  addEventListener(listener: (event: LifecycleEvent) => void): void {
    this.listeners.push(listener)
  }
  removeEventListener(listener: (event: LifecycleEvent) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  async getMetrics(): Promise<RequestMetrics> {
    const allRequests = await database.getAllHelpRequests()
    const resolvedRequests = allRequests.filter((r) => r.status === "resolved")
    const timeoutRequests = allRequests.filter((r) => r.status === "timeout")
    const pendingRequests = allRequests.filter((r) => r.status === "pending")
    let totalResponseTime = 0
    let responseTimeCount = 0
    resolvedRequests.forEach((request) => {
      if (request.resolvedAt) {
        const responseTime = request.resolvedAt.getTime() - request.createdAt.getTime()
        totalResponseTime += responseTime
        responseTimeCount++
      }
    })
    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0
    return {
      averageResponseTime: Math.round(averageResponseTime / (1000 * 60)),
      timeoutRate: allRequests.length > 0 ? (timeoutRequests.length / allRequests.length) * 100 : 0,
      resolutionRate: allRequests.length > 0 ? (resolvedRequests.length / allRequests.length) * 100 : 0,
      totalRequests: allRequests.length,
      pendingRequests: pendingRequests.length,
    }
  }
  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        this.cleanupOldEvents()
        database.cleanupTimeoutRequests()
      },
      5 * 60 * 1000,
    )
  }
  private cleanupOldEvents(): void {
    const allEvents = this.getAllEvents()
    if (allEvents.length > 1000) {
      const eventsToKeep = allEvents.slice(0, 1000)
      this.events.clear()
      eventsToKeep.forEach((event) => {
        const existingEvents = this.events.get(event.requestId) || []
        existingEvents.push(event)
        this.events.set(event.requestId, existingEvents)
      })
      console.log(`[Lifecycle] Cleaned up old events, kept ${eventsToKeep.length} recent events`)
    }
  }
  async forceTimeout(requestId: string): Promise<void> {
    await this.handleTimeout(requestId)
  }
  async getRequestStatus(requestId: string): Promise<{
    request: HelpRequest | null
    events: LifecycleEvent[]
    timeRemaining?: number
  }> {
    const request = await database.getHelpRequest(requestId)
    const events = this.getRequestEvents(requestId)
    let timeRemaining: number | undefined
    if (request && request.status === "pending") {
      const timeoutTime = request.timeoutAt.getTime()
      const now = Date.now()
      timeRemaining = Math.max(0, timeoutTime - now)
    }
    return { request, events, timeRemaining,}
  }
}
export const requestLifecycleManager = new RequestLifecycleManager()
