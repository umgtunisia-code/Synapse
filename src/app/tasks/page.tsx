'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Project, TaskWithProject } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import { getProjectsByUser } from '@/lib/services/projectService';
import { getTasksByUser } from '@/lib/services/taskService';
import { createProject } from '@/lib/services/projectService';
import { createTask } from '@/lib/services/taskService';
import { toggleTaskCompletion } from '@/lib/services/taskService';

export default function TasksPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    dueAt: new Date().toISOString().split('T')[0],
    projectId: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasksData();
    }
  }, [user]);

  const loadTasksData = async () => {
    if (!user) return;
    
    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);
      
      const userTasks = await getTasksByUser(user.id);
      setTasks(userTasks as TaskWithProject[]);
    } catch (error) {
      console.error('Error loading tasks data:', error);
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

  const handleCreateTask = async () => {
    if (!user || !newTask.title || !newTask.projectId || !newTask.dueAt) return;
    
    try {
      const dueDate = new Date(newTask.dueAt);
      const createdTask = await createTask({
        userId: user.id,
        projectId: newTask.projectId,
        title: newTask.title,
        description: newTask.description,
        dueAt: dueDate,
      });
      
      setTasks([...tasks, { task: createdTask as any, project: projects.find(p => p.id === newTask.projectId)! }]);
      setNewTask({ 
        title: '', 
        description: '', 
        dueAt: new Date().toISOString().split('T')[0],
        projectId: ''
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const updatedTask = await toggleTaskCompletion(taskId, user!.id, !currentStatus);
      setTasks(tasks.map(t => 
        t.task.id === taskId ? { ...t, task: { ...t.task, isCompleted: !currentStatus } } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !selectedProject || task.task.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onAddProject={handleAddProject} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and deadlines</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Create New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Project</label>
                  <select
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueAt}
                    onChange={(e) => setNewTask({ ...newTask, dueAt: e.target.value })}
                  />
                </div>
                
                <Button onClick={handleCreateTask} disabled={!newTask.title || !newTask.projectId}>
                  <Plus className="mr-2 h-4 w-4" /> Create Task
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value ? e.target.value : null)}
                className="border rounded-md p-2"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {filteredTasks.map((taskWithProject) => (
                <Card key={taskWithProject.task.id}>
                  <CardContent className="p-4 flex items-start space-x-4">
                    <Checkbox
                      checked={taskWithProject.task.isCompleted}
                      onCheckedChange={() => handleToggleTask(taskWithProject.task.id, taskWithProject.task.isCompleted)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className={`font-medium ${taskWithProject.task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {taskWithProject.task.title}
                        </h3>
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: taskWithProject.project.color }}
                        >
                          {taskWithProject.project.name}
                        </span>
                      </div>
                      
                      {taskWithProject.task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{taskWithProject.task.description}</p>
                      )}
                      
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(taskWithProject.task.dueAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}