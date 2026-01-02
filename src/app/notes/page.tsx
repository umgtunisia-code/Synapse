'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Project, NoteWithProject } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search } from 'lucide-react';
import { getProjectsByUser } from '@/lib/services/projectService';
import { getNotesByUser } from '@/lib/services/noteService';
import { createProject } from '@/lib/services/projectService';
import { createNote } from '@/lib/services/noteService';

export default function NotesPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<NoteWithProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotesData();
    }
  }, [user]);

  const loadNotesData = async () => {
    if (!user) return;
    
    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);
      
      const userNotes = await getNotesByUser(user.id);
      setNotes(userNotes as NoteWithProject[]);
    } catch (error) {
      console.error('Error loading notes data:', error);
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

  const handleCreateNote = async () => {
    if (!user || !selectedProject || !newNote.title) return;
    
    try {
      const createdNote = await createNote({
        projectId: selectedProject,
        title: newNote.title,
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: newNote.content }] }] },
      });
      
      setNotes([...notes, { note: createdNote as any, project: projects.find(p => p.id === selectedProject)! }]);
      setNewNote({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.note.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.note.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !selectedProject || note.note.projectId === selectedProject;
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
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Create and manage your notes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Create New Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Project</label>
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value)}
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
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Note title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Content</label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Note content"
                    rows={4}
                  />
                </div>
                
                <Button onClick={handleCreateNote} disabled={!selectedProject || !newNote.title}>
                  <Plus className="mr-2 h-4 w-4" /> Create Note
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((noteWithProject) => (
                <Card key={noteWithProject.note.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{noteWithProject.note.title || 'Untitled'}</CardTitle>
                      <span 
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: noteWithProject.project.color }}
                      >
                        {noteWithProject.project.name}
                      </span>
                    </div>
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
              
              {filteredNotes.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No notes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}