'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { Project, NoteWithProject, TaskWithProject } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { getProjectsByUser } from '@/lib/services/projectService';
import { getNotesByProject } from '@/lib/services/noteService';
import { getTasksByProject } from '@/lib/services/taskService';
import { createProject } from '@/lib/services/projectService';

export default function ProjectDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const projectId = params.id as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<NoteWithProject[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && projectId) {
      loadProjectData();
    }
  }, [user, projectId]);

  const loadProjectData = async () => {
    if (!user || !projectId) return;
    
    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);
      
      // Find the specific project
      const currentProject = userProjects.find((p: any) => p.id === projectId);
      setProject(currentProject as Project);
      
      // Load notes and tasks for this project
      const projectNotes = await getNotesByProject(projectId, user.id);
      setNotes(projectNotes as NoteWithProject[]);
      
      const projectTasks = await getTasksByProject(projectId, user.id);
      setTasks(projectTasks as TaskWithProject[]);
    } catch (error) {
      console.error('Error loading project data:', error);
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

  if (!project) {
    return <div className="flex items-center justify-center h-screen">Project not found</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onAddProject={handleAddProject} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold mr-4" style={{ color: project.color }}>
              {project.name}
            </h1>
            <div className="text-sm text-muted-foreground">
              {tasks.length} tasks • {notes.length} notes
            </div>
          </div>
          <p className="text-muted-foreground">Manage your {project.name} project</p>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Tasks</CardTitle>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((taskWithProject) => (
                    <Card key={taskWithProject.task.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`font-medium ${taskWithProject.task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {taskWithProject.task.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(taskWithProject.task.dueAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No tasks in this project yet</p>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Create First Task
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Notes</CardTitle>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Note
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.map((noteWithProject) => (
                    <Card key={noteWithProject.note.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{noteWithProject.note.title || 'Untitled'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3">
                          {noteWithProject.note.content?.content?.[0]?.content?.[0]?.text || 'No content'}
                        </p>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {notes.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">No notes in this project yet</p>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Create First Note
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}