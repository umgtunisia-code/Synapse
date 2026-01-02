'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Project, Note } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Plus, ArrowUpRight } from 'lucide-react';
import { getProjectsByUser } from '@/lib/services/projectService';
import { getNoteById } from '@/lib/services/noteService';
import { updateNote } from '@/lib/services/noteService';
import { createTask } from '@/lib/services/taskService';
import { createProject } from '@/lib/services/projectService';

export default function NoteDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState<any>(null);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && noteId) {
      loadNoteData();
    }
  }, [user, noteId]);

  const loadNoteData = async () => {
    if (!user || !noteId) return;
    
    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);
      
      const noteData = await getNoteById(noteId, user.id);
      if (noteData && noteData.length > 0) {
        const fullNote = noteData[0].notes;
        setNote(fullNote as Note);
        setNoteTitle(fullNote.title || '');
        setNoteContent(fullNote.content);
      }
    } catch (error) {
      console.error('Error loading note data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!user || !note) return;
    
    try {
      await updateNote(note.id, user.id, {
        title: noteTitle,
        content: noteContent,
        updatedAt: new Date(),
      });
      // Optionally show a success message
    } catch (error) {
      console.error('Error updating note:', error);
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

  // Function to handle text selection for note-to-task conversion
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '') {
      setHighlightedText(selection.toString());
      setTaskTitle(selection.toString());
    }
  };

  const handleCreateTaskFromNote = async () => {
    if (!user || !note || !selectedProjectForTask || !taskTitle) return;
    
    try {
      // Create a task with the selected text
      const newTask = await createTask({
        userId: user.id,
        projectId: selectedProjectForTask,
        title: taskTitle,
        description: `Created from note: ${noteTitle}`,
        dueAt: new Date(),
      });
      
      // Reset form
      setTaskTitle('');
      setSelectedProjectForTask('');
      setHighlightedText('');
      
      // Optionally navigate to the tasks page
      router.push('/tasks');
    } catch (error) {
      console.error('Error creating task from note:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!note) {
    return <div className="flex items-center justify-center h-screen">Note not found</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar projects={projects} onAddProject={handleAddProject} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Note</h1>
          <p className="text-muted-foreground">Manage your note content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title"
                  className="text-2xl font-bold border-none focus-visible:ring-0"
                />
              </CardHeader>
              <CardContent>
                <TiptapEditor 
                  content={noteContent || ''} 
                  onUpdate={(content) => {
                    setNoteContent(content);
                    handleTextSelection(); // Check for text selection when content changes
                  }} 
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleUpdateNote}>
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Convert to Task</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Convert selected text to a task
                </p>
                
                {highlightedText && (
                  <div className="mb-4 p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium">Selected text:</p>
                    <p className="truncate">{highlightedText}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Task Title</label>
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Task title"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Project</label>
                    <select
                      value={selectedProjectForTask}
                      onChange={(e) => setSelectedProjectForTask(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={handleCreateTaskFromNote} 
                    disabled={!selectedProjectForTask || !taskTitle}
                    className="w-full"
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" /> Create Task
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" /> Add to Project
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Share
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600">
                    Delete Note
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