import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Plus, 
  Edit,
  Trash2,
  Eye,
  BookOpen,
  FileText,
  Clock,
  BarChart3,
  MoreHorizontal,
  Volume2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useChapters } from "@/hooks/useChapters"
import { useUser } from "@/components/user-context"
import { ChapterSoundManager } from "./chapter-sound-manager"
import { toast } from "sonner"

interface ManageChaptersProps {
  onNavigate: (page: string, data?: any) => void
  story?: any
}

export function ManageChapters({ onNavigate, story: passedStory }: ManageChaptersProps) {
  const { user } = useUser()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null)
  const [showSoundManager, setShowSoundManager] = useState(false)
  const [soundChapter, setSoundChapter] = useState<any>(null)
  
  // Use passed story data or fallback to default
  const story = passedStory || {
    id: "default",
    title: "Select a Story",
    status: "draft" as const,
    totalReads: 0,
    totalLikes: 0,
    totalComments: 0
  }

  const { chapters, loading, deleteChapter, publishChapter } = useChapters(story.id)

  // Transform real chapters for display
  const displayChapters = chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.content?.substring(0, 100) + "..." || "No description",
    wordCount: (chapter as any).word_count || 0,
    slides: (chapter as any).slide_count || 0,
    status: chapter.status,
    reads: chapter.view_count || 0,
    likes: 0, // This would come from a likes aggregation
    comments: 0, // This would come from comments aggregation
    lastUpdated: new Date(chapter.updated_at).toLocaleDateString(),
    readingTime: Math.ceil(((chapter as any).word_count || 0) / 200) // Assuming 200 words per minute
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "default"
      case "draft": return "secondary"
      default: return "secondary"
    }
  }

  const handleDeleteClick = (chapterId: string) => {
    setChapterToDelete(chapterId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!chapterToDelete) return
    
    try {
      await deleteChapter(chapterToDelete)
      toast.success("Chapter deleted successfully")
    } catch (error) {
      toast.error("Failed to delete chapter")
    }
    
    setDeleteDialogOpen(false)
    setChapterToDelete(null)
  }

  const handlePublishChapter = async (chapterId: string) => {
    try {
      await publishChapter(chapterId)
      toast.success("Chapter published successfully")
    } catch (error) {
      toast.error("Failed to publish chapter")
    }
  }

  const publishedChapters = displayChapters.filter(c => c.status === "published")
  const draftChapters = displayChapters.filter(c => c.status === "draft")
  const totalProgress = displayChapters.length > 0 ? (publishedChapters.length / displayChapters.length * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("manage-stories")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">{story.title}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage chapters and track progress</p>
          </div>
        </div>
        <Button className="vine-button-hero text-sm sm:text-base w-full sm:w-auto" onClick={() => onNavigate("add-chapter")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      {/* Story Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="vine-card text-center">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold">{displayChapters.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Chapters</div>
          </CardContent>
        </Card>

        <Card className="vine-card text-center">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold">{publishedChapters.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>

        <Card className="vine-card text-center">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold">{displayChapters.reduce((acc, ch) => acc + ch.readingTime, 0)}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Reading Time (min)</div>
          </CardContent>
        </Card>

        <Card className="vine-card text-center">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold">{Math.round(totalProgress)}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="vine-card">
        <CardHeader>
          <CardTitle>Story Progress</CardTitle>
          <CardDescription>Track your publishing progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Published Chapters</span>
              <span>{publishedChapters.length}/{displayChapters.length}</span>
            </div>
            <Progress value={totalProgress} />
          </div>
        </CardContent>
      </Card>

      {/* Chapters List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Chapters</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading chapters...</div>
        ) : displayChapters.map((chapter, index) => (
          <Card key={chapter.id} className="vine-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Chapter Number */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                  <span className="font-bold text-primary text-sm sm:text-base">{index + 1}</span>
                </div>

                {/* Chapter Details */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-base sm:text-lg">{chapter.title}</h3>
                      {chapter.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusColor(chapter.status)} className="text-xs">
                      {chapter.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="text-center">
                      <span className="font-medium block">{chapter.wordCount}</span>
                      <div className="text-xs">words</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium block">{chapter.slides}</span>
                      <div className="text-xs">slides</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium block">{chapter.readingTime}</span>
                      <div className="text-xs">min read</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium block">{chapter.reads}</span>
                      <div className="text-xs">reads</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium block">{chapter.likes}</span>
                      <div className="text-xs">likes</div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium block">{chapter.comments}</span>
                      <div className="text-xs">comments</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between pt-2">
                    <div className="text-xs text-muted-foreground text-center sm:text-left">
                      Last updated: {chapter.lastUpdated}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      {chapter.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handlePublishChapter(chapter.id)}
                          className="w-full sm:w-auto text-xs"
                        >
                          Publish
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const chapterData = chapters.find(c => c.id === chapter.id)
                          onNavigate("add-chapter", { 
                            editData: { 
                              chapter: chapterData, 
                              storyId: story.id 
                            }
                          })
                        }}
                        className="w-full sm:w-auto text-xs"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onNavigate("slide-reader")}
                        className="w-full sm:w-auto text-xs"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Preview
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="ml-1 sm:hidden">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const chapterData = chapters.find(c => c.id === chapter.id)
                              setSoundChapter(chapterData)
                              setShowSoundManager(true)
                            }}
                          >
                            <Volume2 className="h-4 w-4 mr-2" />
                            Manage Audio
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClick(chapter.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {displayChapters.length === 0 && !loading && (
        <Card className="vine-card">
          <CardContent className="pt-6 pb-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No chapters yet</h3>
            <p className="text-muted-foreground mb-4">
              Start writing by adding your first chapter
            </p>
            <Button className="vine-button-hero" onClick={() => onNavigate("add-chapter")}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Chapter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chapter? This action cannot be undone and will permanently remove the chapter and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete Chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sound Manager Modal */}
      {showSoundManager && soundChapter && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chapter Audio Settings</CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowSoundManager(false)
                    setSoundChapter(null)
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <ChapterSoundManager 
                chapterId={soundChapter.id}
                chapterTitle={soundChapter.title}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}