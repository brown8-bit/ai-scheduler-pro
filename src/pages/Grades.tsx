import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plus, 
  GraduationCap, 
  BookOpen, 
  Trash2,
  TrendingUp,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Course {
  id: string;
  name: string;
  credit_hours: number;
  current_grade: number | null;
  semester: string | null;
  is_active: boolean;
}

interface Grade {
  id: string;
  course_name: string;
  assignment_name: string;
  grade_value: number | null;
  max_grade: number;
  weight: number;
  category: string;
}

const Grades = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  
  const [newCourse, setNewCourse] = useState({
    name: "",
    credit_hours: "3",
    current_grade: "",
    semester: "",
  });
  
  const [newGrade, setNewGrade] = useState({
    course_name: "",
    assignment_name: "",
    grade_value: "",
    max_grade: "100",
    weight: "1",
    category: "assignment",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      fetchData();
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    const [coursesRes, gradesRes] = await Promise.all([
      supabase.from("courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("grades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (coursesRes.data) setCourses(coursesRes.data);
    if (gradesRes.data) setGrades(gradesRes.data);
    setIsLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!user || !newCourse.name.trim()) return;

    const { error } = await supabase.from("courses").insert({
      user_id: user.id,
      name: newCourse.name.trim(),
      credit_hours: parseFloat(newCourse.credit_hours) || 3,
      current_grade: newCourse.current_grade ? parseFloat(newCourse.current_grade) : null,
      semester: newCourse.semester.trim() || null,
    });

    if (error) {
      toast({ title: "Error creating course", variant: "destructive" });
    } else {
      toast({ title: "Course added! 📚" });
      setNewCourse({ name: "", credit_hours: "3", current_grade: "", semester: "" });
      setCourseDialogOpen(false);
      fetchData();
    }
  };

  const handleCreateGrade = async () => {
    if (!user || !newGrade.course_name.trim() || !newGrade.assignment_name.trim()) return;

    const { error } = await supabase.from("grades").insert({
      user_id: user.id,
      course_name: newGrade.course_name.trim(),
      assignment_name: newGrade.assignment_name.trim(),
      grade_value: newGrade.grade_value ? parseFloat(newGrade.grade_value) : null,
      max_grade: parseFloat(newGrade.max_grade) || 100,
      weight: parseFloat(newGrade.weight) || 1,
      category: newGrade.category,
    });

    if (error) {
      toast({ title: "Error adding grade", variant: "destructive" });
    } else {
      toast({ title: "Grade added! ✅" });
      setNewGrade({ course_name: "", assignment_name: "", grade_value: "", max_grade: "100", weight: "1", category: "assignment" });
      setGradeDialogOpen(false);
      fetchData();
    }
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (!error) {
      toast({ title: "Course deleted" });
      fetchData();
    }
  };

  const deleteGrade = async (id: string) => {
    const { error } = await supabase.from("grades").delete().eq("id", id);
    if (!error) {
      toast({ title: "Grade deleted" });
      fetchData();
    }
  };

  // Calculate GPA (4.0 scale)
  const calculateGPA = () => {
    const activeCourses = courses.filter(c => c.is_active && c.current_grade !== null);
    if (activeCourses.length === 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    activeCourses.forEach(course => {
      const gradePoint = getGradePoint(course.current_grade!);
      totalPoints += gradePoint * course.credit_hours;
      totalCredits += course.credit_hours;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
  };

  const getGradePoint = (percentage: number): number => {
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    if (percentage >= 60) return 0.7;
    return 0.0;
  };

  const getLetterGrade = (percentage: number | null): string => {
    if (percentage === null) return "—";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  };

  const getGradeColor = (percentage: number | null): string => {
    if (percentage === null) return "text-muted-foreground";
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 80) return "text-blue-500";
    if (percentage >= 70) return "text-yellow-500";
    if (percentage >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const gpa = calculateGPA();
  const totalCredits = courses.reduce((sum, c) => sum + c.credit_hours, 0);
  const averageGrade = courses.filter(c => c.current_grade !== null).length > 0
    ? (courses.filter(c => c.current_grade !== null).reduce((sum, c) => sum + (c.current_grade || 0), 0) / courses.filter(c => c.current_grade !== null).length).toFixed(1)
    : null;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                Grade Tracker
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your courses and calculate your GPA 📊
              </p>
            </div>
          </div>

          {/* GPA Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-3xl font-bold text-primary">{gpa || "—"}</p>
                <p className="text-xs text-muted-foreground">Current GPA</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-xs text-muted-foreground">Courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{totalCredits}</p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${getGradeColor(averageGrade ? parseFloat(averageGrade) : null)}`}>
                  {averageGrade ? `${averageGrade}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="courses" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Course</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Course Name</Label>
                        <Input
                          value={newCourse.name}
                          onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                          placeholder="e.g., Introduction to Psychology"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Credit Hours</Label>
                          <Input
                            type="number"
                            value={newCourse.credit_hours}
                            onChange={(e) => setNewCourse({ ...newCourse, credit_hours: e.target.value })}
                            min="0"
                            max="6"
                          />
                        </div>
                        <div>
                          <Label>Current Grade (%)</Label>
                          <Input
                            type="number"
                            value={newCourse.current_grade}
                            onChange={(e) => setNewCourse({ ...newCourse, current_grade: e.target.value })}
                            placeholder="Optional"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Semester (optional)</Label>
                        <Input
                          value={newCourse.semester}
                          onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                          placeholder="e.g., Fall 2024"
                        />
                      </div>
                      <Button onClick={handleCreateCourse} className="w-full">
                        Add Course
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {courses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No courses yet. Add your first course!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <Card key={course.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{course.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{course.credit_hours} credits</span>
                              {course.semester && <span>{course.semester}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getGradeColor(course.current_grade)}`}>
                                {course.current_grade !== null ? `${course.current_grade}%` : "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getLetterGrade(course.current_grade)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCourse(course.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Assignment Grade</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Course</Label>
                        <Input
                          value={newGrade.course_name}
                          onChange={(e) => setNewGrade({ ...newGrade, course_name: e.target.value })}
                          placeholder="Course name"
                        />
                      </div>
                      <div>
                        <Label>Assignment Name</Label>
                        <Input
                          value={newGrade.assignment_name}
                          onChange={(e) => setNewGrade({ ...newGrade, assignment_name: e.target.value })}
                          placeholder="e.g., Midterm Exam"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Score</Label>
                          <Input
                            type="number"
                            value={newGrade.grade_value}
                            onChange={(e) => setNewGrade({ ...newGrade, grade_value: e.target.value })}
                            placeholder="Your score"
                          />
                        </div>
                        <div>
                          <Label>Max Score</Label>
                          <Input
                            type="number"
                            value={newGrade.max_grade}
                            onChange={(e) => setNewGrade({ ...newGrade, max_grade: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={newGrade.category}
                            onValueChange={(value) => setNewGrade({ ...newGrade, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assignment">Assignment</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="participation">Participation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            value={newGrade.weight}
                            onChange={(e) => setNewGrade({ ...newGrade, weight: e.target.value })}
                            min="0"
                            step="0.1"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateGrade} className="w-full">
                        Add Grade
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {grades.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No assignments yet. Add your first grade!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {grades.map((grade) => (
                    <Card key={grade.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{grade.assignment_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {grade.course_name} • {grade.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-xl font-bold ${getGradeColor(grade.grade_value !== null ? (grade.grade_value / grade.max_grade) * 100 : null)}`}>
                                {grade.grade_value !== null ? `${grade.grade_value}/${grade.max_grade}` : "—"}
                              </p>
                              {grade.grade_value !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {((grade.grade_value / grade.max_grade) * 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteGrade(grade.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Grades;
