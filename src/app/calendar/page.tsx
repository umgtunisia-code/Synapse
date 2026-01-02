'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Project, TaskWithProject, CalendarEvent } from '@/types';
import { Sidebar } from '@/components/ui/sidebar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getProjectsByUser, createProject } from '@/lib/services/projectService';
import { getTasksByDateRange, updateTask } from '@/lib/services/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CalendarPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user]);

  const loadCalendarData = async () => {
    if (!user) return;

    try {
      const userProjects = await getProjectsByUser(user.id);
      setProjects(userProjects as Project[]);

      // Get tasks for the current month
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const userTasks = await getTasksByDateRange(user.id, startOfMonth, endOfMonth);

      // Transform the data to match CalendarEvent type
      const transformedEvents = userTasks.map((item: any) => ({
        id: item.tasks.id,
        title: item.tasks.title,
        start: item.tasks.dueAt,
        end: item.tasks.dueAt,
        projectId: item.tasks.projectId,
        projectName: item.project.name,
        projectColor: item.project.color,
        isCompleted: item.tasks.isCompleted,
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    // Handle date selection for creating new events
    console.log('Selected date range:', selectInfo.start, selectInfo.end);
  };

  const handleEventClick = (clickInfo: any) => {
    // Handle event click for editing tasks
    console.log('Clicked event:', clickInfo.event);
    // Navigate to the task detail page
    window.open(`/tasks/${clickInfo.event.id}`, '_blank');
  };

  const handleEventDrop = async (dropInfo: any) => {
    // Handle drag-and-drop rescheduling of tasks
    const taskId = dropInfo.event.id;
    const newDate = dropInfo.event.start;

    try {
      // Update the task with the new due date
      await updateTask(taskId, user!.id, {
        dueAt: newDate,
        updatedAt: new Date(),
      });

      // Show success message
      toast.success('Task rescheduled successfully');

      // Reload calendar data to reflect changes
      loadCalendarData();
    } catch (error) {
      console.error('Error rescheduling task:', error);
      toast.error('Failed to reschedule task');

      // Revert the event to its original position
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    // Handle event resizing (if needed for duration-based tasks)
    console.log('Resized event:', resizeInfo);
  };

  const handleAddProject = async () => {
    if (!user) return;

    try {
      const newProject = await createProject({
        userId: user.id,
        name: 'New Project',
      });
      setProjects([...projects, newProject as Project]);
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
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
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View and manage your tasks on the calendar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[700px]">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView="dayGridMonth"
                events={events.map(event => ({
                  id: event.id,
                  title: event.title,
                  start: event.start,
                  end: event.end,
                  backgroundColor: event.isCompleted ? '#9ca3af' : event.projectColor, // Gray if completed
                  borderColor: event.isCompleted ? '#9ca3af' : event.projectColor,
                  textColor: '#ffffff',
                  extendedProps: {
                    isCompleted: event.isCompleted,
                    projectId: event.projectId,
                    projectName: event.projectName
                  }
                }))}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                editable={true}
                selectable={true}
                dayMaxEvents={true}
                nowIndicator={true}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}