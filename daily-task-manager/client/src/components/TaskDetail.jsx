import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { TaskModal } from './TaskModal';
import { apiFetch } from '../utils/api';

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
      const res = await apiFetch(`/api/tasks/${id}`);
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

  const handleSaveEdit = async (title, text, status) => {
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, text, status })
      });
      fetchTask();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchTask();
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
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
          <button className="icon-btn back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Task Details</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="secondary-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit2 size={16} /> <span className="btn-text">Edit</span>
          </button>
          <button className="secondary-btn" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <Trash2 size={16} /> <span className="btn-text">Delete</span>
          </button>
        </div>
      </div>

      <div className="detail-container">
        <div className="detail-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className={`status-dot ${task.status}`}></div>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  outline: 'none',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-panel-hover)'
                }}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
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
