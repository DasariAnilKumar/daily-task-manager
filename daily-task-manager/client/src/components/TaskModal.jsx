import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { X } from 'lucide-react';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image'
];

export function TaskModal({ isOpen, onClose, onSave, initialTask }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('todo');

  useEffect(() => {
    if (isOpen) {
      setContent(initialTask ? initialTask.text : '');
      setTitle(initialTask ? (initialTask.title || '') : '');
      setStatus(initialTask ? (initialTask.status || 'todo') : 'todo');
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (content.length > MAX_SIZE) {
      alert('The task details are too large (maximum size is 5MB). If you added large images, please compress or resize them and try again.');
      return;
    }

    onSave(title, content, status);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{initialTask ? 'Edit Task' : 'New Task'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Task Title</label>
            <input 
              type="text" 
              placeholder="Task Title (Required)" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              style={{ width: '100%', fontSize: '16px', fontWeight: 'bold' }}
            />
          </div>
          
          <div>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input"
              style={{ width: '100%', height: '42px', appearance: 'auto' }}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="quill-container">
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={setContent} 
            modules={modules}
            formats={formats}
            placeholder="Write your task details here... Add images, links, etc."
          />
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSave}>Save Task</button>
        </div>
      </div>
    </div>
  );
}
