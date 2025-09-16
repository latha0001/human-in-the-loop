import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageSquare, Brain, Users, Settings, Eye } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Supervisor System</h1>
          <p className="text-muted-foreground text-lg">Human-in-the-loop AI agent for Bella's Beauty Salon</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No active calls</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No pending help requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Learned answers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs"> Online</Badge>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Status</CardTitle>
              <CardDescription>LiveKit AI agent for Bella's Beauty Salon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Agent Status</span>
                <Badge variant="default">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>LiveKit Connection</span>
                <Badge variant="secondary">Connected</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  The AI agent is ready to handle calls for Bella's Beauty Salon. It knows about services, pricing, and
                  booking procedures.
                </p>
                <Button className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Simulate Incoming Call
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">System initialized</div>
                  <div className="text-muted-foreground">AI agent connected to LiveKit</div>
                  <div className="text-xs text-muted-foreground">Just now</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Knowledge base loaded</div>
                  <div className="text-muted-foreground">5 pre-configured answers available</div>
                  <div className="text-xs text-muted-foreground">Just now</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Supervisor Dashboard
              </CardTitle>
              <CardDescription>View and respond to pending help requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access the supervisor interface to handle escalated questions from the AI agent and build the knowledge
                base.
              </p>
              <Link href="/supervisor">
                <Button className="w-full">Open Supervisor Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>Manage learned answers and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4"> View and manage the AI agent's knowledge base with all learned answers from supervisor responses.</p>
              <Link href="/knowledge">
                <Button variant="outline" className="w-full bg-transparent"> View Knowledge Base</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Simulator
              </CardTitle>
              <CardDescription>Test the AI agent with simulated calls</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4"> Simulate phone calls to test the AI agent's responses and escalation behavior.</p>
              <Link href="/simulator">
                <Button variant="outline" className="w-full bg-transparent"> Open Simulator</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
