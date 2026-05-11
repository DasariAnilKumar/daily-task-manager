import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SortableTask({ id, task, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card"
    >
      <div 
        {...attributes}
        {...listeners}
        style={{ flex: 1, paddingRight: '24px' }}
      >
        <Link 
          to={`/task/${id}`} 
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div className="task-text" style={{ fontWeight: 600, fontSize: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.title || 'Untitled'}
          </div>
        </Link>
      </div>
      <div className="task-actions" style={{ position: 'absolute', top: '12px', right: '12px' }}>
        <button 
          className="icon-btn delete-btn"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
