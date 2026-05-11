import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';
import { DroppableColumn } from './DroppableColumn';
import { TaskModal } from './TaskModal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

function TaskBoard() {
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?date=${currentDate}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  const handleDateChange = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const getFormatDate = () => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date(currentDate).toLocaleDateString('en-US', options);
  };

  const handleSaveTask = async (title, text) => {
    // Create new
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const newSortOrder = todoTasks.length > 0 ? Math.max(...todoTasks.map(t => t.sort_order)) + 1 : 0;

    const newTask = {
      id: Date.now().toString(),
      title: title,
      text: text,
      status: 'todo',
      date: currentDate,
      sort_order: newSortOrder
    };

    setTasks(prev => [...prev, newTask]);

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
    } catch (err) {
      console.error('Failed to add task', err);
    }
    
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Is it dropping over a column?
    const isOverColumn = COLUMNS.some(c => c.id === overId);
    
    // Find task being dragged
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    let newTasks = [...tasks];
    let updates = [];

    // Dropping in the same column but reordering
    if (!isOverColumn && activeId !== overId) {
      const activeTaskIdx = newTasks.findIndex(t => t.id === activeId);
      const overTaskIdx = newTasks.findIndex(t => t.id === overId);
      const overTask = newTasks[overTaskIdx];

      if (activeTask.status === overTask.status) {
        // Reorder within same column
        const columnTasks = newTasks.filter(t => t.status === activeTask.status);
        const activeIdxInCol = columnTasks.findIndex(t => t.id === activeId);
        const overIdxInCol = columnTasks.findIndex(t => t.id === overId);
        
        const newColumnTasks = arrayMove(columnTasks, activeIdxInCol, overIdxInCol);
        
        // Update sort_orders and build update payload
        newColumnTasks.forEach((t, idx) => {
          const taskInState = newTasks.find(nt => nt.id === t.id);
          taskInState.sort_order = idx;
          updates.push({ id: t.id, status: t.status, sort_order: idx });
        });
      } else {
        // Moved to a different column by hovering over a task
        activeTask.status = overTask.status;
        
        const targetColTasks = newTasks.filter(t => t.status === overTask.status && t.id !== activeId);
        const overIdxInCol = targetColTasks.findIndex(t => t.id === overId);
        
        targetColTasks.splice(overIdxInCol, 0, activeTask);
        
        targetColTasks.forEach((t, idx) => {
          t.sort_order = idx;
          updates.push({ id: t.id, status: t.status, sort_order: idx });
        });
      }
    } 
    // Dropping onto an empty column
    else if (isOverColumn && activeTask.status !== overId) {
      activeTask.status = overId;
      const targetColTasks = newTasks.filter(t => t.status === overId && t.id !== activeId);
      
      targetColTasks.push(activeTask);
      targetColTasks.forEach((t, idx) => {
        t.sort_order = idx;
        updates.push({ id: t.id, status: t.status, sort_order: idx });
      });
    }

    if (updates.length > 0) {
      setTasks(newTasks);
      try {
        await fetch('/api/tasks/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });
      } catch (err) {
        console.error('Failed to update task order', err);
      }
    }
  };

  return (
    <>
      <div className="top-header">
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Daily Dashboard</h1>
        <div className="date-navigation">
          <button className="date-btn" onClick={() => handleDateChange(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input[type="date"]');
              if (input && input.showPicker) {
                input.showPicker();
              }
            }}
          >
            <span className="current-date" style={{ padding: '0 8px' }}>{getFormatDate()}</span>
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '0', height: '0' }}
            />
          </div>
          <button className="date-btn" onClick={() => handleDateChange(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-container">
          {COLUMNS.map(col => {
            const columnTasks = tasks
              .filter(t => t.status === col.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <div key={col.id} className="column">
                <div className="column-header">
                  <div className="column-header-title">
                    <div className={`status-dot ${col.id}`}></div>
                    {col.title}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    {columnTasks.length}
                  </span>
                </div>

                {/* Drop zone for empty column */}
                <SortableContext 
                  id={col.id}
                  items={columnTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn id={col.id}>
                    {columnTasks.map(task => (
                      <SortableTask key={task.id} id={task.id} task={task} onDelete={handleDeleteTask} />
                    ))}
                  </DroppableColumn>
                </SortableContext>

                {col.id === 'todo' && (
                  <button className="add-task-btn" onClick={openAddModal}>
                    <Plus size={16} /> Add Task
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Render the dragged item outside of any scrollable container */}
        <DragOverlay>
          {activeTask ? (
            <div className="task-card" style={{ opacity: 1, cursor: 'grabbing', boxShadow: 'var(--shadow-lg)' }}>
              <div className="task-text" style={{ fontWeight: 600, fontSize: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {activeTask.title || 'Untitled'}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTask}
      />
    </>
  );
}

export default TaskBoard;
