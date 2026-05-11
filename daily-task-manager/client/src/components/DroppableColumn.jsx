import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function DroppableColumn({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(255, 255, 255, 0.02)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="task-list">
      {children}
    </div>
  );
}
