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

  useEffect(() => {
    if (isOpen) {
      setContent(initialTask ? initialTask.text : '');
      setTitle(initialTask ? (initialTask.title || '') : '');
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    onSave(title, content);
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
        
        <div style={{ padding: '24px 24px 0' }}>
          <input 
            type="text" 
            placeholder="Task Title (Required)" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            style={{ width: '100%', fontSize: '18px', fontWeight: 'bold' }}
          />
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
