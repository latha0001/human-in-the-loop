"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, Phone, Timer, Activity } from "lucide-react"
import { database, type HelpRequest } from "@/lib/database"
import { requestLifecycleManager, type LifecycleEvent, type RequestMetrics } from "@/lib/request-lifecycle"

export default function SupervisorDashboard() {
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([])
  const [allRequests, setAllRequests] = useState<HelpRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null)
  const [recentEvents, setRecentEvents] = useState<LifecycleEvent[]>([])
  const [requestTimeRemaining, setRequestTimeRemaining] = useState<Record<string, number>>({})
  useEffect(() => {
    loadRequests()
    loadMetrics()
    loadRecentEvents()
    const interval = setInterval(() => {
      loadRequests()
      loadMetrics()
      updateTimeRemaining()
    },
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    const eventListener = (event: LifecycleEvent) => {
      console.log(`[Dashboard] Received lifecycle event: ${event.type} for ${event.requestId}`)
      loadRequests()
      loadMetrics()
      loadRecentEvents()
    }
    requestLifecycleManager.addEventListener(eventListener)
    return () => {
      requestLifecycleManager.removeEventListener(eventListener)
    }
  }, [])
  const loadRequests = async () => {
    try {
      const pending = await database.getPendingHelpRequests()
      const all = await database.getAllHelpRequests()
      setPendingRequests(pending)
      setAllRequests(all)
    } catch (error) {
      console.error("Failed to load requests:", error)
    }
  }
  const loadMetrics = async () => {
    try {
      const requestMetrics = await requestLifecycleManager.getMetrics()
      setMetrics(requestMetrics)
    } catch (error) {
      console.error("Failed to load metrics:", error)
    }
  }
  const loadRecentEvents = () => {
    const events = requestLifecycleManager.getAllEvents().slice(0, 10)
    setRecentEvents(events)
  }
  const updateTimeRemaining = async () => {
    const timeRemaining: Record<string, number> = {}
    for (const request of pendingRequests) {
      if (request.status === "pending") {
        const status = await requestLifecycleManager.getRequestStatus(request.id)
        if (status.timeRemaining !== undefined) {
          timeRemaining[request.id] = status.timeRemaining
        }
      }
    }
    setRequestTimeRemaining(timeRemaining)
  }
  const handleSubmitResponse = async () => {
    if (!selectedRequest || !response.trim()) return
    setIsSubmitting(true)
    try {
      await requestLifecycleManager.handleSupervisorResponse(selectedRequest.id, response.trim())
      setResponse("")
      setSelectedRequest(null)
      await loadRequests()
      await loadMetrics()
      console.log(`[Supervisor] Resolved request ${selectedRequest.id}`)
    } catch (error) {
      console.error("Failed to submit response:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  const extractTags = (question: string): string[] => {
    const lowerQuestion = question.toLowerCase()
    const tags: string[] = []
    if (lowerQuestion.includes("price") || lowerQuestion.includes("cost") || lowerQuestion.includes("$")) {
      tags.push("pricing")
    }
    if (lowerQuestion.includes("hour") || lowerQuestion.includes("time") || lowerQuestion.includes("open")) {
      tags.push("hours")
    }
    if (lowerQuestion.includes("book") || lowerQuestion.includes("appointment")) {
      tags.push("booking")
    }
    if (lowerQuestion.includes("service")) {
      tags.push("services")
    }
    if (lowerQuestion.includes("location") || lowerQuestion.includes("address")) {
      tags.push("location")
    }
    return tags.length > 0 ? tags : ["general"]
  }
  const getStatusIcon = (status: HelpRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "timeout":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }
  const getStatusBadge = (status: HelpRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "resolved":
        return <Badge variant="default">Resolved</Badge>
      case "timeout":
        return <Badge variant="destructive">Timeout</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${minutes}m ${seconds}s`
  }
  const getTimeRemainingProgress = (ms: number) => {
    const totalTime = 30 * 60 * 1000 // 30 minutes in ms
    return Math.max(0, (ms / totalTime) * 100)
  }
  const getEventIcon = (type: LifecycleEvent["type"]) => {
    switch (type) {
      case "created":
        return <AlertCircle className="h-3 w-3 text-blue-500" />
      case "escalated":
        return <MessageSquare className="h-3 w-3 text-yellow-500" />
      case "responded":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "timeout":
        return <XCircle className="h-3 w-3 text-red-500" />
      case "resolved":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      default:
        return <Activity className="h-3 w-3 text-gray-500" />
    }
  }
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Supervisor Dashboard</h1>
          <p className="text-muted-foreground">Manage AI agent help requests and responses</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.pendingRequests || 0}</div>
              <p className="text-xs text-muted-foreground">
                {(metrics?.pendingRequests || 0) === 0 ? "All caught up!" : "Needs attention"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Timer className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.averageResponseTime || 0}m</div>
              <p className="text-xs text-muted-foreground">Average response time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics?.resolutionRate || 0)}%</div>
              <p className="text-xs text-muted-foreground">Successfully resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeout Rate</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics?.timeoutRate || 0)}%</div>
              <p className="text-xs text-muted-foreground">Timed out requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalRequests || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Requests ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="history">Request History</TabsTrigger>
            <TabsTrigger value="events">Lifecycle Events</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-6">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center"> No pending help requests at the moment. Great job!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pending Requests</h3>
                  {pendingRequests.map((request) => {
                    const timeRemaining = requestTimeRemaining[request.id]
                    const progress = timeRemaining ? getTimeRemainingProgress(timeRemaining) : 0
                    return (
                      <Card
                        key={request.id}
                        className={`cursor-pointer transition-colors ${
                          selectedRequest?.id === request.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedRequest(request)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              <CardTitle className="text-sm">Request #{request.id.slice(-6)}</CardTitle>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {request.customerPhone} • {formatTimeAgo(request.createdAt)}
                          </CardDescription>
                          {timeRemaining && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Time remaining</span>
                                <span className="font-medium">{formatTimeRemaining(timeRemaining)}</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium mb-2">Customer Question:</p>
                          <p className="text-sm text-muted-foreground">{request.question}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <div className="space-y-4">
                  {selectedRequest ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Respond to Request
                        </CardTitle>
                        <CardDescription> Provide an answer that will be sent to the customer and added to the knowledge base</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Customer Question</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            <p className="text-sm">{selectedRequest.question}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Customer Phone</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            <p className="text-sm">{selectedRequest.customerPhone}</p>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="response">Your Response</Label>
                          <Textarea id="response" placeholder="Type your response here. This will be sent to the customer and saved to the knowledge base." value={response} onChange={(e) => setResponse(e.target.value)} className="min-h-[120px] mt-1"/>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSubmitResponse} disabled={!response.trim() || isSubmitting} className="flex-1">
                            {isSubmitting ? "Submitting..." : "Submit Response"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(null)
                              setResponse("")
                            }}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Select a Request</h3>
                        <p className="text-muted-foreground text-center"> Choose a pending request from the left to provide a response</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Request History</h3>
              {allRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                    <p className="text-muted-foreground text-center"> Help requests will appear here once the AI agent starts receiving calls</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {allRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <CardTitle className="text-sm">Request #{request.id.slice(-6)}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(request.createdAt)}</span>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {request.customerPhone}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Question:</p>
                          <p className="text-sm text-muted-foreground">{request.question}</p>
                        </div>
                        {request.supervisorResponse && (
                          <div>
                            <p className="text-sm font-medium mb-1">Response:</p>
                            <p className="text-sm text-muted-foreground">{request.supervisorResponse}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Lifecycle Events</h3>
              {recentEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                    <p className="text-muted-foreground text-center">
                      Lifecycle events will appear here as requests are processed
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium capitalize">{event.type.replace("-", " ")}</p>
                              <span className="text-xs text-muted-foreground">{formatTimeAgo(event.timestamp)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Request #{event.requestId.slice(-6)}</p>
                            {event.details && <p className="text-sm text-muted-foreground mt-1">{event.details}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
