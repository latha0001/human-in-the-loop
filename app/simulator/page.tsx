"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Phone, MessageSquare, User, Bot, PhoneCall, Send, Brain, CheckCircle, AlertCircle } from "lucide-react"
import { liveKitAgent, type CallSession, type HelpRequest } from "@/lib/livekit-agent"
import { database, type KnowledgeBaseEntry } from "@/lib/database"

export default function SimulatorPage() {
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null)
  const [customerPhone, setCustomerPhone] = useState("+1 (555) 123-4567")
  const [customerMessage, setCustomerMessage] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeBaseEntry[]>([])
  const [lastResponse, setLastResponse] = useState<{ question: string; answer: string; wasLearned: boolean } | null>( null,)
  useEffect(() => {
    liveKitAgent.onHelpRequestCreated((request) => {
      setHelpRequests((prev) => [request, ...prev])
    })
    loadHelpRequests()
    loadKnowledgeBase()}, [])
  const loadHelpRequests = async () => {
    try {
      const requests = await database.getAllHelpRequests()
      setHelpRequests(requests.slice(0, 5)) // Show last 5 requests
    } catch (error) {
      console.error("Failed to load help requests:", error)
    }
  }
  const loadKnowledgeBase = async () => {
    try {
      const entries = await database.getAllKnowledgeEntries()
      setKnowledgeEntries(entries)
    } catch (error) {
      console.error("Failed to load knowledge base:", error)
    }
  }
  const startCall = async () => {
    try {
      const session = await liveKitAgent.receiveCall(customerPhone)
      setCurrentSession(session)
      setIsCallActive(true)
      setLastResponse(null)
      console.log(`[Simulator] Started call simulation with ${customerPhone}`)
    } catch (error) {
      console.error("Failed to start call:", error)
    }
  }
  const sendMessage = async () => {
    if (!customerMessage.trim() || !currentSession) return
    try {
      const knowledgeEntries = await database.getAllKnowledgeEntries()
      const lowerQuestion = customerMessage.toLowerCase()
      let wasLearned = false
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
          wasLearned = true
          break
        }
      }
      const response = await liveKitAgent.processQuestion(customerMessage.trim())
      setLastResponse({
        question: customerMessage.trim(),
        answer: response,
        wasLearned: wasLearned && !response.includes("Let me check with my supervisor"),
      })
      setCustomerMessage("")
      const updatedSession = liveKitAgent.getCurrentSession()
      setCurrentSession(updatedSession)
      await loadHelpRequests()
      await loadKnowledgeBase()
      console.log(`[Simulator] Customer: ${customerMessage}`)
      console.log(`[Simulator] AI Response: ${response}`)
      console.log(`[Simulator] Was learned response: ${wasLearned}`)
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }
  const endCall = () => {
    liveKitAgent.endCall()
    setCurrentSession(null)
    setIsCallActive(false)
    setCustomerMessage("")
    setLastResponse(null)
    console.log("[Simulator] Call ended")
  }
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit",}).format(date)
  }
  const sampleQuestions = [
    "What are your hours?",
    "How much does a haircut cost?", 
    "Do you do hair coloring?", 
    "Where are you located?", 
    "Can I book an appointment online?", 
    "Do you offer wedding hair services?", 
    "What's your cancellation policy?", 
    "Do you have parking available?", 
    "Can you do hair extensions?", 
  ]
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Agent Simulator</h1>
          <p className="text-muted-foreground"> Test the AI agent with simulated phone calls and watch it learn from supervisor responses</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call Simulation
                </CardTitle>
                <CardDescription>Simulate incoming calls to test AI agent responses and learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Customer Phone Number</Label>
                  <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={isCallActive}/>
                </div>
                {!isCallActive ? (
                  <Button onClick={startCall} className="w-full">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Start Call Simulation
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-800">Call Active</span>
                      </div>
                      <Badge variant="secondary">{formatTime(currentSession?.startTime || new Date())}</Badge>
                    </div>
                    {lastResponse && (
                      <div
                        className={`p-3 rounded-md border ${
                          lastResponse.wasLearned
                            ? "bg-blue-50 border-blue-200"
                            : lastResponse.answer.includes("Let me check with my supervisor")
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-gray-50 border-gray-200"
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {lastResponse.wasLearned ? (
                            <>
                              <Brain className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">AI Used Learned Knowledge</span>
                            </>
                          ) : lastResponse.answer.includes("Let me check with my supervisor") ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Escalated to Supervisor</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-800">Used Built-in Knowledge</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {lastResponse.wasLearned
                            ? "The AI found a similar question in its learned knowledge base and provided an answer automatically."
                            : lastResponse.answer.includes("Let me check with my supervisor")
                              ? "The AI doesn't know this answer yet and will ask a supervisor for help."
                              : "The AI used its built-in salon knowledge to answer this question."}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="message">Customer Message</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="message"
                          placeholder="Type what the customer is saying..."
                          value={customerMessage}
                          onChange={(e) => setCustomerMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            } }} className="min-h-[80px]"/>
                        <Button onClick={sendMessage} disabled={!customerMessage.trim()} className="shrink-0">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={endCall} className="flex-1"> End Call</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {currentSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Call Transcript
                  </CardTitle>
                  <CardDescription>Real-time conversation between customer and AI agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentSession.transcript.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Conversation will appear here as you interact with the AI agent
                      </p>
                    ) : (
                      currentSession.transcript.map((message, index) => {
                        const [speaker, ...messageParts] = message.split(": ")
                        const messageText = messageParts.join(": ")
                        const isAI = speaker === "AI"
                        return (
                          <div key={index} className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                isAI ? "bg-blue-100" : "bg-green-100"
                              }`}>
                              {isAI ? (
                                <Bot className="h-4 w-4 text-blue-600" />
                              ) : (
                                <User className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className={`flex-1 ${isAI ? "" : "text-right"}`}>
                              <div className="text-xs text-muted-foreground mb-1">{speaker}</div>
                              <div
                                className={`inline-block p-3 rounded-lg max-w-[80%] ${
                                  isAI
                                    ? "bg-blue-50 text-blue-900 rounded-tl-none"
                                    : "bg-green-50 text-green-900 rounded-tr-none"
                                }`}>
                                <p className="text-sm">{messageText}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sample Questions</CardTitle>
                <CardDescription>Try these questions to test different scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleQuestions.map((question, index) => (
                    <Button key={index} variant="outline" size="sm" className="w-full justify-start text-left h-auto p-3 bg-transparent" onClick={() => setCustomerMessage(question)} disabled={!isCallActive}>
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Knowledge Base
                </CardTitle>
                <CardDescription>What the AI has learned from supervisor responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Entries</span>
                    <Badge variant="secondary">{knowledgeEntries.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Used</span>
                    <span className="text-sm font-medium">
                      {knowledgeEntries.length > 0
                        ? Math.max(...knowledgeEntries.map((e) => e.usageCount)) + " times"
                        : "0 times"}
                    </span>
                  </div>
                  {knowledgeEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="p-2 bg-muted rounded text-xs">
                      <div className="font-medium mb-1">{entry.question}</div>
                      <div className="text-muted-foreground">{entry.answer.substring(0, 60)}...</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-1">
                          {entry.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-muted-foreground">{entry.usageCount} uses</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Help Requests</CardTitle>
                <CardDescription>Questions that triggered supervisor escalation</CardDescription>
              </CardHeader>
              <CardContent>
                {helpRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm"> No help requests yet. Try asking questions the AI doesn't know!</p>
                ) : (
                  <div className="space-y-3">
                    {helpRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              request.status === "pending"
                                ? "secondary"
                                : request.status === "resolved"
                                  ? "default"
                                  : "destructive"
                            }>
                            {request.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatTime(request.createdAt)}</span>
                        </div>
                        <p className="text-sm">{request.question}</p>
                        {request.supervisorResponse && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Response:</strong> {request.supervisorResponse}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Call Statistics</CardTitle>
                <CardDescription>Current session metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Status</span>
                    <Badge variant={isCallActive ? "default" : "secondary"}>
                      {isCallActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Messages Exchanged</span>
                    <span className="text-sm font-medium">{currentSession?.transcript.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Help Requests</span>
                    <span className="text-sm font-medium">{helpRequests.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Duration</span>
                    <span className="text-sm font-medium">
                      {currentSession
                        ? `${Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000)}s`
                        : "0s"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
