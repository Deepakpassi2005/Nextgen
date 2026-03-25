import { useAdminQuizzes, useDeleteAdminQuiz, useUpdateAdminQuiz } from "@/lib/hooks";
import { Loader2, Trash2, HelpCircle, Edit2, Plus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function QuizzesPage() {
  const { data: quizzes, isLoading } = useAdminQuizzes();
  const deleteQuiz = useDeleteAdminQuiz();
  const updateQuiz = useUpdateAdminQuiz();
  const { toast } = useToast();

  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editQuestions, setEditQuestions] = useState<any[]>([]);

  const handleEditClick = (quiz: any) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditDescription(quiz.description || "");
    setEditDuration(quiz.duration?.toString() || "");
    setEditDueDate(quiz.dueDate ? new Date(quiz.dueDate).toISOString().split('T')[0] : "");
    setEditQuestions(quiz.questions ? JSON.parse(JSON.stringify(quiz.questions)) : []);
  };

  const handleUpdateQuestion = (index: number, value: string) => {
    const newQuestions = [...editQuestions];
    newQuestions[index].question = value;
    setEditQuestions(newQuestions);
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].options[oIndex] = value;
    setEditQuestions(newQuestions);
  };

  const handleToggleCorrect = (qIndex: number, option: string) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].answer = option;
    setEditQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setEditQuestions([
      ...editQuestions,
      {
        question: "",
        options: ["", "", "", ""],
        answer: "",
        marks: 1
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setEditQuestions(editQuestions.filter((_, i) => i !== index));
  };

  const handleAddOption = (qIndex: number) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].options.push("");
    setEditQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...editQuestions];
    const optionToRemove = newQuestions[qIndex].options[oIndex];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_: any, i: number) => i !== oIndex);
    if (newQuestions[qIndex].answer === optionToRemove) {
        newQuestions[qIndex].answer = "";
    }
    setEditQuestions(newQuestions);
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    try {
      await updateQuiz.mutateAsync({
        id: editingQuiz._id,
        data: {
          title: editTitle,
          description: editDescription,
          duration: parseInt(editDuration) || 0,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
          questions: editQuestions.map(q => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            marks: q.marks || 1
          })),
        },
      });
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
      setEditingQuiz(null);
      setEditQuestions([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quiz",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the quiz "${title}"?`)) {
      try {
        await deleteQuiz.mutateAsync(id);
        toast({
          title: "Success",
          description: "Quiz deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete quiz",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
          Quizzes
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage quizzes created by teachers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quizzes</CardTitle>
          <CardDescription>
            View and manage all quizzes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizzes && quizzes.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz: any) => (
                    <TableRow key={quiz._id}>
                      <TableCell className="font-medium">{quiz.title}</TableCell>
                      <TableCell>{quiz.classId?.name || "N/A"}</TableCell>
                      <TableCell>{quiz.subjectId?.name || "N/A"}</TableCell>
                      <TableCell>{quiz.teacherId?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quiz.questions?.length || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {quiz.dueDate
                          ? new Date(quiz.dueDate).toLocaleDateString()
                          : "No due date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(quiz)}
                        >
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quiz._id, quiz.title)}
                          disabled={deleteQuiz.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Quizzes Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                There are currently no quizzes in the system. Teachers can create quizzes for their classes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Quiz Dialog */}
      <Dialog open={!!editingQuiz} onOpenChange={(open) => !open && setEditingQuiz(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle className="text-2xl">Edit Quiz</DialogTitle>
            <DialogDescription>
              Modify quiz details below. High impact changes should be verified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-6 space-y-6 pb-12">
                <form id="edit-quiz-form" onSubmit={handleUpdateQuiz} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Quiz Title</Label>
                      <Input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        className="bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-duration">Duration (minutes)</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        required
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Due Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Questions ({editQuestions.length})
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="border-primary text-primary hover:bg-primary/5">
                      <Plus className="h-4 w-4 mr-1" /> Add Question
                    </Button>
                  </div>

                  <div className="space-y-8">
                    {editQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="p-6 border rounded-xl space-y-6 relative bg-card shadow-sm group transition-all hover:shadow-md">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => handleRemoveQuestion(qIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="space-y-2">
                          <Label className="text-primary font-bold">Question {qIndex + 1}</Label>
                          <Input
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(qIndex, e.target.value)}
                            placeholder="Enter the question here..."
                            required
                            className="text-lg py-6 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              Options
                            </Label>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/5" onClick={() => handleAddOption(qIndex)}>
                              <Plus className="h-3 w-3 mr-1" /> Add Option
                            </Button>
                          </div>
                          
                          <div className="grid gap-3">
                            {q.options.map((option: string, oIndex: number) => (
                              <div key={oIndex} className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className={`h-10 w-10 flex-shrink-0 rounded-full transition-all ${q.answer === option && option !== "" ? "text-white bg-green-500 hover:bg-green-600 shadow-md scale-110" : "text-muted-foreground hover:bg-muted border border-dashed hover:border-solid"}`}
                                  onClick={() => handleToggleCorrect(qIndex, option)}
                                  disabled={!option}
                                  title={q.answer === option ? "Correct Answer" : "Mark as Correct"}
                                >
                                  <CheckCircle2 className={`h-6 w-6`} />
                                </Button>
                                <Input
                                  value={option}
                                  onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className={`flex-1 h-12 ${q.answer === option && option !== "" ? "border-green-500 bg-green-50/30 focus-visible:ring-green-500" : "bg-muted/10 border-transparent focus-visible:border-input"}`}
                                  required
                                />
                                {q.options.length > 2 && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          {q.answer === "" && q.options.some((opt: string) => opt !== "") && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 text-destructive text-sm border border-destructive/10">
                              <HelpCircle className="h-4 w-4" />
                              <span>Please select which option is the correct answer.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-6 border-t bg-muted/5 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingQuiz(null)}
              className="px-8"
            >
              Cancel
            </Button>
            <Button 
              form="edit-quiz-form" 
              type="submit" 
              disabled={updateQuiz.isPending}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              {updateQuiz.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
