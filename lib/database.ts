export interface HelpRequest {
  id: string
  callSessionId: string
  question: string
  customerPhone: string
  status: "pending" | "resolved" | "timeout"
  createdAt: Date
  resolvedAt?: Date
  supervisorResponse?: string
  timeoutAt: Date 
}
export interface KnowledgeBaseEntry {
  id: string
  question: string
  answer: string
  createdAt: Date
  usageCount: number
  tags: string[]
}
export interface CallSession {
  id: string
  phoneNumber: string
  startTime: Date
  endTime?: Date
  status: "active" | "completed" | "escalated"
  transcript: string[]
  helpRequestIds: string[]
}
class InMemoryDatabase {
  private helpRequests: Map<string, HelpRequest> = new Map()
  private knowledgeBase: Map<string, KnowledgeBaseEntry> = new Map()
  private callSessions: Map<string, CallSession> = new Map()
  constructor() {
    this.initializeKnowledgeBase()
  }
  private initializeKnowledgeBase(): void {
    const initialEntries: Omit<KnowledgeBaseEntry, "id" | "createdAt" | "usageCount">[] = [
      {
        question: "What are your hours?",
        answer: "We're open Tuesday-Saturday 9am-7pm, closed Sunday and Monday",
        tags: ["hours", "schedule"],
      },
      {
        question: "How much does a haircut cost?",
        answer: "We offer haircuts for $45-65 depending on length and style",
        tags: ["pricing", "haircut", "services"],
      },
      {
        question: "Do you do hair coloring?",
        answer: "Hair coloring starts at $85 for single process, $120 for highlights",
        tags: ["coloring", "services", "pricing"],
      },
      {
        question: "Where are you located?",
        answer: "We're located at 123 Beauty Lane, downtown area with free parking",
        tags: ["location", "address", "parking"],
      },
      {
        question: "How do I book an appointment?",
        answer: "You can book online at our website or call us directly",
        tags: ["booking", "appointment", "online"],
      },
    ]
    initialEntries.forEach((entry, index) => {
      const id = `kb_${index + 1}`
      this.knowledgeBase.set(id, {
        ...entry,
        id,
        createdAt: new Date(),
        usageCount: 0,
      })
    })
  }
  async createHelpRequest(request: Omit<HelpRequest, "id" | "timeoutAt">): Promise<HelpRequest> {
    const id = `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timeoutAt = new Date(Date.now() + 30 * 60 * 1000) 
    const helpRequest: HelpRequest = { ...request, id, timeoutAt,}
    this.helpRequests.set(id, helpRequest)
    console.log(`[Database] Created help request: ${id}`)
    return helpRequest
  }
  async getHelpRequest(id: string): Promise<HelpRequest | null> {
    return this.helpRequests.get(id) || null
  }
  async getAllHelpRequests(): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  async getPendingHelpRequests(): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values())
      .filter((req) => req.status === "pending")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }
  async updateHelpRequest(id: string, updates: Partial<HelpRequest>): Promise<HelpRequest | null> {
    const existing = this.helpRequests.get(id)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    this.helpRequests.set(id, updated)
    console.log(`[Database] Updated help request ${id}: ${JSON.stringify(updates)}`)
    return updated
  }
  async resolveHelpRequest(id: string, supervisorResponse: string): Promise<HelpRequest | null> {
    return this.updateHelpRequest(id, { status: "resolved", supervisorResponse, resolvedAt: new Date(),})
  }
  async addKnowledgeEntry(
    entry: Omit<KnowledgeBaseEntry, "id" | "createdAt" | "usageCount">,
  ): Promise<KnowledgeBaseEntry> {
    const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const knowledgeEntry: KnowledgeBaseEntry = { ...entry, id, createdAt: new Date(), usageCount: 0,}
    this.knowledgeBase.set(id, knowledgeEntry)
    console.log(`[Database] Added knowledge entry: ${id}`)
    return knowledgeEntry
  }
  async getAllKnowledgeEntries(): Promise<KnowledgeBaseEntry[]> {
    return Array.from(this.knowledgeBase.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  async searchKnowledge(query: string): Promise<KnowledgeBaseEntry[]> {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.knowledgeBase.values())
      .filter(
        (entry) =>
          entry.question.toLowerCase().includes(lowerQuery) ||
          entry.answer.toLowerCase().includes(lowerQuery) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      )
      .sort((a, b) => b.usageCount - a.usageCount)
  }
  async updateKnowledgeUsage(id: string): Promise<KnowledgeBaseEntry | null> {
    const existing = this.knowledgeBase.get(id)
    if (!existing) return null
    const updated = { ...existing, usageCount: existing.usageCount + 1 }
    this.knowledgeBase.set(id, updated)
    console.log(`[Database] Updated knowledge usage for ${id}: ${updated.usageCount} uses`)
    return updated
  }
  async getKnowledgeEntry(id: string): Promise<KnowledgeBaseEntry | null> {
    return this.knowledgeBase.get(id) || null
  }
  async updateKnowledgeEntry(id: string, updates: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry | null> {
    const existing = this.knowledgeBase.get(id)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    this.knowledgeBase.set(id, updated)
    console.log(`[Database] Updated knowledge entry ${id}`)
    return updated
  }
  async deleteKnowledgeEntry(id: string): Promise<boolean> {
    const deleted = this.knowledgeBase.delete(id)
    if (deleted) {
      console.log(`[Database] Deleted knowledge entry ${id}`)
    }
    return deleted
  }
  async createCallSession(session: Omit<CallSession, "helpRequestIds">): Promise<CallSession> {
    const callSession: CallSession = { ...session, helpRequestIds: [], }
    this.callSessions.set(session.id, callSession)
    console.log(`[Database] Created call session: ${session.id}`)
    return callSession
  }
  async getCallSession(id: string): Promise<CallSession | null> {
    return this.callSessions.get(id) || null
  }
  async updateCallSession(id: string, updates: Partial<CallSession>): Promise<CallSession | null> {
    const existing = this.callSessions.get(id)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    this.callSessions.set(id, updated)
    return updated
  }
  async cleanupTimeoutRequests(): Promise<number> {
    const now = new Date()
    let timeoutCount = 0
    for (const [id, request] of this.helpRequests.entries()) {
      if (request.status === "pending" && request.timeoutAt < now) {
        await this.updateHelpRequest(id, { status: "timeout" })
        timeoutCount++
      }
    }
    if (timeoutCount > 0) {
      console.log(`[Database] Timed out ${timeoutCount} help requests`)
    }
    return timeoutCount
  }
  async getStats() {
    const helpRequests = Array.from(this.helpRequests.values())
    const knowledgeEntries = Array.from(this.knowledgeBase.values())
    const callSessions = Array.from(this.callSessions.values())
    return {
      totalHelpRequests: helpRequests.length,
      pendingRequests: helpRequests.filter((r) => r.status === "pending").length,
      resolvedRequests: helpRequests.filter((r) => r.status === "resolved").length,
      timeoutRequests: helpRequests.filter((r) => r.status === "timeout").length,
      knowledgeBaseSize: knowledgeEntries.length,
      totalCalls: callSessions.length,
      activeCalls: callSessions.filter((s) => s.status === "active").length,
    }
  }
}
export const database = new InMemoryDatabase()
setInterval(
  () => {
    database.cleanupTimeoutRequests()
  },
  5 * 60 * 1000,
)
