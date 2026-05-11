import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { TaskModal } from './TaskModal';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setTask(data);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (title, text) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text })
      });
      fetchTask();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  if (loading) return <div style={{ padding: '32px' }}>Loading...</div>;
  if (!task) return <div style={{ padding: '32px' }}>Task not found</div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="icon-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Task Details</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="secondary-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit2 size={16} /> Edit
          </button>
          <button className="secondary-btn" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div className={`status-dot ${task.status}`}></div>
            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 500 }}>{task.status.replace('-', ' ')}</span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{new Date(task.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>{task.title}</h1>
          
          <div 
            className="rich-text-content" 
            dangerouslySetInnerHTML={{ __html: task.text }}
          />
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEdit}
        initialTask={task}
      />
    </div>
  );
}
