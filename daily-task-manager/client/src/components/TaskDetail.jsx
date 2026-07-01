import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Sparkles, CheckSquare } from 'lucide-react';
import { TaskModal } from './TaskModal';
import { AiAssistantModal } from './AiAssistantModal';
import { apiFetch } from '../utils/api';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // Subtasks State
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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

  const fetchSubtasks = async () => {
    try {
      const res = await apiFetch(`/api/tasks/${id}/subtasks`);
      if (res.ok) {
        const data = await res.json();
        setSubtasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch subtasks', err);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  useEffect(() => {
    if (task?.id) {
      fetchSubtasks();
    }
  }, [task?.id]);

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

  const handleUpdateTaskText = async (taskId, updatedFields) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      await fetchTask();
      await fetchSubtasks();
    } catch (err) {
      console.error('Failed to update task via AI', err);
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

  // Subtask Handlers
  const handleToggleSubtask = async (subtaskId, completed) => {
    setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed } : s));
    try {
      await apiFetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed })
      });
    } catch (err) {
      console.error('Failed to toggle subtask', err);
      fetchSubtasks();
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      const res = await apiFetch(`/api/tasks/${id}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({ title: newSubtaskTitle })
      });
      if (res.ok) {
        setNewSubtaskTitle('');
        fetchSubtasks();
      }
    } catch (err) {
      console.error('Failed to add subtask', err);
    }
  };

  const handleCancelSubtask = async (subtaskId) => {
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    try {
      await apiFetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete subtask', err);
      fetchSubtasks();
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
          <button className="secondary-btn" onClick={() => setIsAiModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--primary-color)" /> <span className="btn-text">AI Assistant</span>
          </button>
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
          {/* Header Metadata with custom badges */}
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
            
            {/* AI Priority Badge */}
            {task.priority && (
              <>
                <span style={{ color: 'var(--border-color)' }}>•</span>
                <span className={`ai-badge ${task.priority.toLowerCase()}`} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  🔥 {task.priority} Priority
                </span>
              </>
            )}

            {/* AI Effort Badge */}
            {task.effort_size && (
              <>
                <span style={{ color: 'var(--border-color)' }}>•</span>
                <span className={`ai-badge ${task.effort_size.toLowerCase()}`} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  ⏱ {task.effort_size} ({task.effort_time || 'N/A'})
                </span>
              </>
            )}
          </div>
          
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>{task.title}</h1>

          {/* AI Estimate Reasoning Breakdown */}
          {task.effort_reasoning && (
            <div style={{ 
              backgroundColor: 'var(--bg-sidebar)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              marginBottom: '24px', 
              fontSize: '13px', 
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⏱</span> Effort Estimation Details
              </div>
              <p>{task.effort_reasoning}</p>
            </div>
          )}
          
          {/* Main Task Description */}
          {task.text ? (
            <div 
              className="rich-text-content" 
              dangerouslySetInnerHTML={{ __html: task.text }}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>
              No description added. Click "Edit" above or use the AI Assistant to generate one.
            </div>
          )}

          {/* Subtasks Checklist Section */}
          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} color="var(--primary-color)" />
              <span>Subtasks Checklist</span>
              {subtasks.length > 0 && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({subtasks.filter(s => s.completed).length} of {subtasks.length} completed)
                </span>
              )}
            </h3>

            {/* Subtask Progress Bar */}
            {subtasks.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--primary-color)', 
                      borderRadius: '3px',
                      transition: 'width 0.3s ease' 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Subtasks List */}
            {subtasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {subtasks.map(sub => (
                  <div 
                    key={sub.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      width: '100%', 
                      padding: '6px 8px', 
                      borderRadius: '6px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer', textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '14px' }}>
                      <input 
                        type="checkbox" 
                        checked={!!sub.completed}
                        onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>{sub.title}</span>
                    </label>
                    <button 
                      onClick={() => handleCancelSubtask(sub.id)}
                      className="icon-btn delete-btn"
                      style={{ opacity: 1, padding: '4px', color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', fontStyle: 'italic' }}>
                No subtasks created yet. Add one manually below or ask the AI Assistant to break it down.
              </div>
            )}

            {/* Manual Subtask Input Form */}
            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Add a new subtask..." 
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px', height: '36px' }}
              />
              <button 
                type="submit" 
                className="secondary-btn" 
                style={{ padding: '0 16px', fontSize: '13px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Add Subtask
              </button>
            </form>
          </div>

          {/* AI Suggestions & Ideas Section */}
          {task.ideas && (
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.01) 100%)',
                border: '1px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#a5b4fc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  <span>AI Suggestions & Ideas</span>
                </h3>
                <div 
                  className="rich-text-content" 
                  style={{ color: 'var(--text-main)', fontSize: '13px', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: task.ideas }}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {isAiModalOpen && (
        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          task={task}
          onUpdateTask={handleUpdateTaskText}
        />
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEdit}
        initialTask={task}
      />
    </div>
  );
}
