'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Project, Task } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Edit, Save, X } from 'lucide-react';
import { getProjectsByUser } from '@/lib/services/projectService';
import { getTaskById, updateTask } from '@/lib/services/taskService';
import { toggleTaskCompletion } from '@/lib/services/taskService';
import { createProject } from '@/lib/services/projectService';

export default function TaskDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    dueAt: '',
    projectId: '',
    isCompleted: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && taskId) {
      loadTaskData();
    }
  }, [user, taskId]);

  const loadTaskData = async () => {
    if (!user || !taskId) return;
    
    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);
      
      const taskData = await getTaskById(taskId, user.id);
      if (taskData && taskData.length > 0) {
        const fullTask = taskData[0].tasks;
        setTask(fullTask as Task);
        setTaskData({
          title: fullTask.title,
          description: fullTask.description || '',
          dueAt: new Date(fullTask.dueAt).toISOString().split('T')[0],
          projectId: fullTask.projectId,
          isCompleted: fullTask.isCompleted ?? false
        });
      }
    } catch (error) {
      console.error('Error loading task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async () => {
    if (!user || !task) return;
    
    try {
      const updatedTask = await updateTask(task.id, user.id, {
        title: taskData.title,
        description: taskData.description || null,
        dueAt: new Date(taskData.dueAt),
        projectId: taskData.projectId,
        isCompleted: taskData.isCompleted,
        updatedAt: new Date(),
      });

      setTask(updatedTask[0] as Task);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleToggleCompletion = async () => {
    if (!user || !task) return;
    
    try {
      const updatedTask = await toggleTaskCompletion(task.id, user.id, !task.isCompleted);
      if (updatedTask && updatedTask.length > 0) {
        setTask(updatedTask[0] as Task);
        setTaskData({ ...taskData, isCompleted: !(taskData.isCompleted ?? false) });
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
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

  if (!task) {
    return <div className="flex items-center justify-center h-screen">Task not found</div>;
  }

  const project = projects.find(p => p.id === task.projectId);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onAddProject={handleAddProject} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Task Details</h1>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveTask} variant="default">
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="mr-2 h-4 w-4" /> Edit Task
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={taskData.isCompleted}
                    onCheckedChange={handleToggleCompletion}
                    className="mt-1"
                  />
                  {isEditing ? (
                    <Input
                      value={taskData.title}
                      onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                      className="text-2xl font-bold border-none focus-visible:ring-0"
                    />
                  ) : (
                    <h2 className={`text-2xl font-bold ${taskData.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {taskData.title}
                    </h2>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    placeholder="Task description"
                    rows={6}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {taskData.description || 'No description provided.'}
                  </p>
                )}
                
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Due Date</h3>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={taskData.dueAt}
                        onChange={(e) => setTaskData({ ...taskData, dueAt: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {new Date(task.dueAt).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Project</h3>
                    {isEditing ? (
                      <select
                        value={taskData.projectId}
                        onChange={(e) => setTaskData({ ...taskData, projectId: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: project?.color + '20', color: project?.color }}
                      >
                        {project?.name}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Status</h3>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${taskData.isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span>{taskData.isCompleted ? 'Completed' : 'Pending'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Created</h3>
                    <p className="text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Last Updated</h3>
                    <p className="text-muted-foreground">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/tasks')}
                    >
                      Back to Tasks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Move to Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600">
                    Delete Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}