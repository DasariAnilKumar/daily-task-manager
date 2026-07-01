import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SortableTask({ id, task, onDelete, onAiClick }) {
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
        style={{ flex: 1, paddingRight: '64px' }}
      >
        <Link 
          to={`/task/${id}`} 
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div className="task-text" style={{ fontWeight: 600, fontSize: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.title || 'Untitled'}
          </div>
          {task.priority && (
            <div style={{ marginTop: '6px', display: 'flex' }}>
              <span className={`ai-badge ${task.priority.toLowerCase()}`} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                🔥 {task.priority}
              </span>
            </div>
          )}
        </Link>
      </div>
      <div className="task-actions" style={{ position: 'absolute', top: '12px', right: '12px' }}>
        <button 
          className="icon-btn ai-btn"
          style={{ marginRight: '6px' }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAiClick(task);
          }}
        >
          <Sparkles size={16} color="var(--primary-color)" />
        </button>
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
