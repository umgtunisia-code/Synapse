'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Project, TaskWithProject } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, ListTodo } from 'lucide-react';
import { getProjectsByUser } from '@/lib/services/projectService';
import { getTasksForToday } from '@/lib/services/taskService';
import { createProject } from '@/lib/services/projectService';

export default function DashboardPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);

      const tasksForToday = await getTasksForToday(user.id);
      // Transform the data to match TaskWithProject type
      const transformedTasks = tasksForToday.map((item: any) => ({
        task: {
          id: item.tasks.id,
          userId: item.tasks.userId,
          projectId: item.tasks.projectId,
          noteId: item.tasks.noteId,
          title: item.tasks.title,
          description: item.tasks.description,
          dueAt: item.tasks.dueAt,
          reminderOffsetMinutes: item.tasks.reminderOffsetMinutes,
          isCompleted: item.tasks.isCompleted || false,
          isRecurring: item.tasks.isRecurring || false,
          recurrenceRule: item.tasks.recurrenceRule || undefined,
          createdAt: item.tasks.createdAt,
          updatedAt: item.tasks.updatedAt,
        },
        project: {
          id: item.project.id,
          userId: item.project.userId,
          name: item.project.name,
          color: item.project.color,
          isArchived: item.project.isArchived,
          createdAt: item.project.createdAt,
          updatedAt: item.project.updatedAt,
        }
      }));
      setTodayTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!user) return;

    try {
      const newProject = await createProject({
        userId: user.id,
        name: 'New Project',
      });
      setProjects([...projects, newProject as Project]);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onAddProject={handleAddProject} />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName || user?.username || 'User'}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">+{projects.length} this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayTasks.filter(t => !(t.task.isCompleted ?? false)).length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayTasks.filter(t => t.task.isCompleted ?? false).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((todayTasks.filter(t => t.task.isCompleted ?? false).length / todayTasks.length) * 100) || 0}% completion
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    style={{ borderLeft: `4px solid ${project.color}` }}
                  >
                    <span className="font-medium">{project.name}</span>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No projects yet. Create your first project!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayTasks.map((taskWithProject) => (
                  <div
                    key={taskWithProject.task.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{taskWithProject.task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {taskWithProject.project.name} • {new Date(taskWithProject.task.dueAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${taskWithProject.task.isCompleted ?? false ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                ))}
                {todayTasks.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No tasks due today. Enjoy your day!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}