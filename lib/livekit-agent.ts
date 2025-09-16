import { requestLifecycleManager } from "./request-lifecycle"
import { database } from "./database"

export interface CallSession {
  id: string
  phoneNumber: string
  startTime: Date
  status: "active" | "completed" | "escalated"
  transcript: string[]
}
export interface HelpRequest {
  id: string
  callSessionId: string
  question: string
  customerPhone: string
  status: "pending" | "resolved" | "timeout"
  createdAt: Date
  resolvedAt?: Date
  supervisorResponse?: string
}
const SALON_KNOWLEDGE = {
  services: {
    haircut: "We offer haircuts for $45-65 depending on length and style",
    coloring: "Hair coloring starts at $85 for single process, $120 for highlights",
    manicure: "Basic manicure is $35, gel manicure is $45",
    pedicure: "Basic pedicure is $45, spa pedicure is $65",
    facial: "We offer basic facials for $75 and premium facials for $120",
  },
  hours: "We're open Tuesday-Saturday 9am-7pm, closed Sunday and Monday",
  booking: "You can book online at our website or call us directly",
  location: "We're located at 123 Beauty Lane, downtown area with free parking",
}
export class LiveKitAgent {
  private currentSession: CallSession | null = null
  private onHelpRequest: ((request: HelpRequest) => void) | null = null
  constructor() { console.log("[LiveKit Agent] Initialized for Bella's Beauty Salon")}
  async receiveCall(phoneNumber: string): Promise<CallSession> {
    const session: CallSession = { id: `call_${Date.now()}`, phoneNumber, startTime: new Date(), status: "active", transcript: [],}
    this.currentSession = session
    console.log(`[LiveKit Agent] Incoming call from ${phoneNumber}`)
    this.addToTranscript("AI", "Hello! Thank you for calling Bella's Beauty Salon. How can I help you today?")
    return session
  }
  async processQuestion(question: string): Promise<string> {
    if (!this.currentSession) {
      throw new Error("No active call session")
    }
    this.addToTranscript("Customer", question)
    const answer = await this.findAnswer(question)
    if (answer) {
      this.addToTranscript("AI", answer)
      return answer
    } else {
      const response = "Let me check with my supervisor and get back to you. I'll have an answer for you shortly."
      this.addToTranscript("AI", response)
      await this.createHelpRequest(question)
      return response
    }
  }
  private async findAnswer(question: string): Promise<string | null> {
    const lowerQuestion = question.toLowerCase()
    const learnedAnswer = await this.searchLearnedKnowledge(question)
    if (learnedAnswer) {
      console.log("[AI Agent] Found answer in learned knowledge base")
      return learnedAnswer
    }
    if (lowerQuestion.includes("haircut") || lowerQuestion.includes("hair cut")) {
      return SALON_KNOWLEDGE.services.haircut
    }
    if (lowerQuestion.includes("color") || lowerQuestion.includes("highlight")) {
      return SALON_KNOWLEDGE.services.coloring
    }
    if (lowerQuestion.includes("manicure") || lowerQuestion.includes("nails")) {
      return SALON_KNOWLEDGE.services.manicure
    }
    if (lowerQuestion.includes("pedicure") || lowerQuestion.includes("feet")) {
      return SALON_KNOWLEDGE.services.pedicure
    }
    if (lowerQuestion.includes("facial") || lowerQuestion.includes("skin")) {
      return SALON_KNOWLEDGE.services.facial
    }
    if (lowerQuestion.includes("hours") || lowerQuestion.includes("open") || lowerQuestion.includes("time")) {
      return SALON_KNOWLEDGE.hours
    }
    if (lowerQuestion.includes("book") || lowerQuestion.includes("appointment")) {
      return SALON_KNOWLEDGE.booking
    }
    if (lowerQuestion.includes("location") || lowerQuestion.includes("address") || lowerQuestion.includes("where")) {
      return SALON_KNOWLEDGE.location
    }
    return null 
  }
  private async searchLearnedKnowledge(question: string): Promise<string | null> {
    try {
      const knowledgeEntries = await database.getAllKnowledgeEntries()
      const lowerQuestion = question.toLowerCase()
      for (const entry of knowledgeEntries) {
        const lowerEntryQuestion = entry.question.toLowerCase()
        const questionWords = lowerQuestion.split(" ").filter((word) => word.length > 2)
        const entryWords = lowerEntryQuestion.split(" ").filter((word) => word.length > 2)
        let matchCount = 0
        for (const word of questionWords) {
          if (entryWords.some((entryWord) => entryWord.includes(word) || word.includes(entryWord))) {
            matchCount++
          }
        }
        if (matchCount >= Math.max(1, questionWords.length * 0.5)) {
          console.log(`[AI Agent] Found similar question: "${entry.question}" -> "${entry.answer}"`)
          await database.updateKnowledgeUsage(entry.id)
          return entry.answer
        }
      }
      return null
    } catch (error) {
      console.error("[AI Agent] Error searching learned knowledge:", error)
      return null
    }
  }
  private async createHelpRequest(question: string): Promise<void> {
    if (!this.currentSession) return
    const helpRequest = await requestLifecycleManager.createHelpRequest(
      this.currentSession.id,
      question,
      this.currentSession.phoneNumber,
    )
    console.log(`[LiveKit Agent] Created help request: ${question}`)
    console.log(`[Supervisor Notification] Hey, I need help answering: "${question}"`)
    if (this.onHelpRequest) {
      this.onHelpRequest(helpRequest)
    }
    this.currentSession.status = "escalated"
  }
  async handleSupervisorResponse(helpRequestId: string, response: string): Promise<void> {
    if (!this.currentSession) return
    console.log(`[LiveKit Agent] Received supervisor response for ${helpRequestId}: ${response}`)
    await requestLifecycleManager.handleSupervisorResponse(helpRequestId, response)
    this.addToTranscript("AI", `Follow-up response: ${response}`)
  }
  private updateKnowledgeBase(helpRequestId: string, answer: string): void {
    console.log(`[Knowledge Base] Learning new answer for request ${helpRequestId}: ${answer}`)
  }
  private addToTranscript(speaker: string, message: string): void {
    if (this.currentSession) {
      this.currentSession.transcript.push(`${speaker}: ${message}`)
    }
  }
  onHelpRequestCreated(callback: (request: HelpRequest) => void): void {
    this.onHelpRequest = callback
  }
  getCurrentSession(): CallSession | null {
    return this.currentSession
  }
  endCall(): void {
    if (this.currentSession) {
      this.currentSession.status = "completed"
      console.log(`[LiveKit Agent] Call ${this.currentSession.id} ended`)
      this.currentSession = null
    }
  }
}
export const liveKitAgent = new LiveKitAgent()
