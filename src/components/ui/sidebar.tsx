'use client';

import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Home, Calendar, FileText, ListTodo, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
  projects: Project[];
  onAddProject: () => void;
}

export function Sidebar({ projects, onAddProject }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 sidebar-toggle"
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "h-screen bg-background border-r p-4 flex flex-col transition-transform duration-300 ease-in-out",
          isMobile
            ? `w-64 fixed z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : "w-64"
        )}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Synapse</h1>
          <p className="text-sm text-muted-foreground">Connect your ideas, control your time</p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <Button
                  variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start', pathname === '/dashboard' && 'bg-muted')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/notes" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <Button
                  variant={pathname === '/notes' ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start', pathname === '/notes' && 'bg-muted')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Notes
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/tasks" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <Button
                  variant={pathname === '/tasks' ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start', pathname === '/tasks' && 'bg-muted')}
                >
                  <ListTodo className="mr-2 h-4 w-4" />
                  Tasks
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/calendar" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <Button
                  variant={pathname === '/calendar' ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start', pathname === '/calendar' && 'bg-muted')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto">
          <h3 className="text-sm font-medium mb-2">Projects</h3>
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} onClick={() => isMobile && setIsSidebarOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start',
                      pathname === `/projects/${project.id}` && 'bg-muted'
                    )}
                    style={{ borderLeft: `3px solid ${project.color}` }}
                  >
                    <span className="truncate">{project.name}</span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
          <Button onClick={onAddProject} variant="outline" className="w-full mt-2">
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}