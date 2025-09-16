"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog"
import { Brain, Search, Plus, Tag, Calendar, TrendingUp, BookOpen, Edit } from "lucide-react"
import { database, type KnowledgeBaseEntry } from "@/lib/database"

export default function KnowledgeBasePage() {
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeBaseEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEntries, setFilteredEntries] = useState<KnowledgeBaseEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeBaseEntry | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({ question: "", answer: "", tags: "",})
  const [stats, setStats] = useState({ totalEntries: 0, totalUsage: 0, popularTags: [] as string[],})
  useEffect(() => { loadKnowledgeBase()}, [])
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = knowledgeEntries.filter(
        (entry) =>
          entry.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredEntries(filtered)
    } else {
      setFilteredEntries(knowledgeEntries)
    }
  }, [searchQuery, knowledgeEntries])
  const loadKnowledgeBase = async () => {
    try {
      const entries = await database.getAllKnowledgeEntries()
      setKnowledgeEntries(entries)
      setFilteredEntries(entries)
      const totalUsage = entries.reduce((sum, entry) => sum + entry.usageCount, 0)
      const allTags = entries.flatMap((entry) => entry.tags)
      const tagCounts = allTags.reduce( (acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {} as Record<string, number>)
      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag)
      setStats({ totalEntries: entries.length, totalUsage, popularTags,})
    } catch (error) {
      console.error("Failed to load knowledge base:", error)
    }
  }
  const handleAddEntry = async () => {
    if (!newEntry.question.trim() || !newEntry.answer.trim()) return
    try {
      const tags = newEntry.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      await database.addKnowledgeEntry({ question: newEntry.question.trim(), answer: newEntry.answer.trim(), tags: tags.length > 0 ? tags : ["general"],})
      setNewEntry({ question: "", answer: "", tags: "" })
      setIsAddDialogOpen(false)
      await loadKnowledgeBase()
    } catch (error) {
      console.error("Failed to add knowledge entry:", error)
    }
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",}).format(date)
  }
  const getTagColor = (tag: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ]
    const index = tag.length % colors.length
    return colors[index]
  }
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-muted-foreground">Manage AI agent's learned answers and responses</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Knowledge Entry</DialogTitle>
                <DialogDescription>Add a new question and answer to the AI agent's knowledge base</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Input id="question" placeholder="What question does this answer?" value={newEntry.question} onChange={(e) => setNewEntry({ ...newEntry, question: e.target.value })}/>
                </div>
                <div>
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea id="answer" placeholder="Provide the answer that the AI should give" value={newEntry.answer} onChange={(e) => setNewEntry({ ...newEntry, answer: e.target.value })} className="min-h-[100px]"/>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" placeholder="pricing, services, booking" value={newEntry.tags} onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}/>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddEntry} disabled={!newEntry.question.trim() || !newEntry.answer.trim()}> Add Entry</Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}> Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">Knowledge base entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsage}</div>
              <p className="text-xs text-muted-foreground">Times answers were used</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popular Tags</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.popularTags.length}</div>
              <p className="text-xs text-muted-foreground">
                {stats.popularTags.slice(0, 2).join(", ") || "No tags yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalEntries > 0 ? Math.round(stats.totalUsage / stats.totalEntries) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Uses per entry</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse Entries ({filteredEntries.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search questions, answers, or tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
              </div>
            </div>
            {filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No matching entries" : "No knowledge entries yet"}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Knowledge entries will appear here as supervisors respond to help requests"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base leading-tight">{entry.question}</CardTitle>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {entry.usageCount} uses
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(
                              tag,
                            )}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Answer:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{entry.answer}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Added {formatDate(entry.createdAt)}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Used Entries</CardTitle>
                  <CardDescription>Knowledge entries with highest usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {knowledgeEntries
                      .sort((a, b) => b.usageCount - a.usageCount)
                      .slice(0, 5)
                      .map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.question}</p>
                            <p className="text-xs text-muted-foreground">{entry.tags.slice(0, 2).join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{entry.usageCount}</Badge>
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tag Distribution</CardTitle>
                  <CardDescription>Most common knowledge base tags</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.popularTags.map((tag, index) => {
                      const count = knowledgeEntries.filter((entry) => entry.tags.includes(tag)).length
                      const percentage = Math.round((count / stats.totalEntries) * 100)
                      return (
                        <div key={tag} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{tag}</span>
                            <span className="text-xs text-muted-foreground">
                              {count} entries ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percentage}%` }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Additions</CardTitle>
                  <CardDescription>Latest knowledge base entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {knowledgeEntries
                      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                      .slice(0, 5)
                      .map((entry) => (
                        <div key={entry.id} className="space-y-1">
                          <p className="text-sm font-medium">{entry.question}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {entry.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getTagColor(
                                    tag,
                                  )}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Base Health</CardTitle>
                  <CardDescription>System performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Coverage Rate</span>
                      <Badge variant="default">94%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Response Quality</span>
                      <Badge variant="default">4.8/5</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Knowledge Gaps</span>
                      <Badge variant="secondary">3 identified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Updated</span>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
