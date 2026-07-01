import { useState } from 'react';
import { X, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

export function AiAssistantModal({ isOpen, onClose, task, onUpdateTask }) {
  const [useCustomText, setUseCustomText] = useState(false);
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  if (!isOpen) return null;

  // Clean description HTML to plain text for the AI context if needed
  const getCleanDescription = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleAction = async (actionType) => {
    setLoading(true);
    setError('');
    setCurrentAction(actionType);
    setResult(null);
    setCopied(false);

    const payload = { action: actionType };

    if (useCustomText) {
      if (!customText.trim()) {
        setError('Please enter some text to analyze.');
        setLoading(false);
        return;
      }
      payload.text = customText;
    } else {
      payload.taskTitle = task?.title || 'Untitled';
      payload.taskDescription = getCleanDescription(task?.text);
    }

    try {
      const response = await apiFetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('AI Request failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    
    let textToCopy = '';
    if (result.summary) {
      textToCopy = result.summary.map(item => `• ${item}`).join('\n');
    } else if (result.subtasks) {
      textToCopy = result.subtasks.map(item => `- [ ] ${item}`).join('\n');
    } else if (result.rewrittenText) {
      textToCopy = getCleanDescription(result.rewrittenText);
    } else if (result.ideas) {
      textToCopy = result.ideas.map((item, i) => `${i + 1}. ${item}`).join('\n');
    } else if (result.size) {
      textToCopy = `Estimated Effort: ${result.size}\nTime Estimate: ${result.timeEstimate}\nReasoning: ${result.reasoning}`;
    } else if (result.priority) {
      textToCopy = `Suggested Priority: ${result.priority}\nReasoning: ${result.reasoning}`;
    }

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy to clipboard', err);
      });
  };

  const handleApplySummary = async () => {
    if (!result?.summary || !task?.id || !onUpdateTask) return;
    setApplying(true);
    try {
      const summaryHtml = `
        <p><strong>AI Summary:</strong></p>
        <ul>
          ${result.summary.map(item => `<li>${item}</li>`).join('')}
        </ul>
      `;
      const originalText = task.text || '';
      const updatedText = originalText ? `${originalText}<br/>${summaryHtml}` : summaryHtml;
      
      await onUpdateTask(task.id, { text: updatedText });
      setApplying(false);
      onClose();
    } catch (err) {
      console.error('Failed to apply summary:', err);
      setError('Failed to append summary to task.');
      setApplying(false);
    }
  };

  const handleApplySubtasks = async () => {
    if (!result?.subtasks || !task?.id) return;
    setApplying(true);
    try {
      for (const sub of result.subtasks) {
        await apiFetch(`/api/tasks/${task.id}/subtasks`, {
          method: 'POST',
          body: JSON.stringify({ title: sub })
        });
      }
      setApplying(false);
      if (onUpdateTask) {
        // Trigger a database state refresh in task board / details page
        await onUpdateTask(task.id, {});
      }
      onClose();
    } catch (err) {
      console.error('Failed to apply subtasks:', err);
      setError('Failed to create subtasks in the checklist.');
      setApplying(false);
    }
  };

  const handleApplyRewrite = async () => {
    if (!result?.rewrittenText || !task?.id || !onUpdateTask) return;
    setApplying(true);
    try {
      // Wrap in p tags to fit Rich Text editor standard
      const formattedRewrite = result.rewrittenText.startsWith('<') 
        ? result.rewrittenText 
        : `<p>${result.rewrittenText}</p>`;
      
      await onUpdateTask(task.id, { text: formattedRewrite });
      setApplying(false);
      onClose();
    } catch (err) {
      console.error('Failed to apply rewrite:', err);
      setError('Failed to update task description.');
      setApplying(false);
    }
  };

  const handleApplyIdeas = async () => {
    if (!result?.ideas || !task?.id || !onUpdateTask) return;
    setApplying(true);
    try {
      const ideasHtml = `
        <ul>
          ${result.ideas.map(item => `<li>${item}</li>`).join('')}
        </ul>
      `;
      await onUpdateTask(task.id, { ideas: ideasHtml });
      setApplying(false);
      onClose();
    } catch (err) {
      console.error('Failed to apply ideas:', err);
      setError('Failed to save ideas to the task.');
      setApplying(false);
    }
  };

  const handleApplyEstimate = async () => {
    if (!result?.size || !task?.id || !onUpdateTask) return;
    setApplying(true);
    try {
      await onUpdateTask(task.id, {
        effort_size: result.size,
        effort_time: result.timeEstimate,
        effort_reasoning: result.reasoning
      });
      setApplying(false);
      onClose();
    } catch (err) {
      console.error('Failed to apply estimates:', err);
      setError('Failed to apply estimates to the task.');
      setApplying(false);
    }
  };

  const handleApplyPriority = async () => {
    if (!result?.priority || !task?.id || !onUpdateTask) return;
    setApplying(true);
    try {
      await onUpdateTask(task.id, { priority: result.priority });
      setApplying(false);
      onClose();
    } catch (err) {
      console.error('Failed to apply priority:', err);
      setError('Failed to apply priority to the task.');
      setApplying(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="ai-result-container" style={{ flexShrink: 0 }}>
        <div className="ai-result-header">
          <span className="ai-result-title">Response</span>
          <button 
            className="secondary-btn btn-sm" 
            onClick={copyToClipboard}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="ai-result-body">
          {result.summary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                {result.summary.map((bullet, idx) => (
                  <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-main)' }}>{bullet}</li>
                ))}
              </ul>
              {onUpdateTask && !useCustomText && (
                <button 
                  onClick={handleApplySummary}
                  className="primary-btn" 
                  disabled={applying}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px', marginTop: '8px' }}
                >
                  {applying ? 'Appending...' : 'Append Summary to Task Description'}
                </button>
              )}
            </div>
          )}

          {result.subtasks && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.subtasks.map((sub, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '10px', color: 'var(--text-main)' }}>
                  <input type="checkbox" disabled style={{ marginTop: '4px' }} />
                  <span>{sub}</span>
                </div>
              ))}
              {onUpdateTask && !useCustomText && (
                <button 
                  onClick={handleApplySubtasks}
                  className="primary-btn" 
                  disabled={applying}
                  style={{ marginTop: '16px', alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px' }}
                >
                  {applying ? 'Creating...' : 'Create as Subtasks Checklist'}
                </button>
              )}
            </div>
          )}

          {result.rewrittenText && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                className="rich-text-content" 
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)' }}
                dangerouslySetInnerHTML={{ __html: result.rewrittenText }}
              />
              {onUpdateTask && !useCustomText && (
                <button 
                  onClick={handleApplyRewrite}
                  className="primary-btn" 
                  disabled={applying}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px' }}
                >
                  {applying ? 'Applying...' : 'Apply rewritten description'}
                </button>
              )}
            </div>
          )}

          {result.ideas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                {result.ideas.map((idea, idx) => (
                  <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-main)' }}>{idea}</li>
                ))}
              </ol>
              {onUpdateTask && !useCustomText && (
                <button 
                  onClick={handleApplyIdeas}
                  className="primary-btn" 
                  disabled={applying}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px', marginTop: '8px' }}
                >
                  {applying ? 'Saving...' : 'Apply & Save Ideas to Task Details'}
                </button>
              )}
            </div>
          )}

          {result.size && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effort Size</span>
                  <span className={`ai-badge ${result.size.toLowerCase()}`} style={{ fontWeight: 600, fontSize: '14px', padding: '4px 10px', borderRadius: '4px', textAlign: 'center' }}>
                    {result.size}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Time</span>
                  <span className="ai-badge time" style={{ fontWeight: 600, fontSize: '14px', padding: '4px 10px', borderRadius: '4px', textAlign: 'center', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    {result.timeEstimate}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Reasoning</span>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-main)' }}>{result.reasoning}</p>
              </div>
              {onUpdateTask && !useCustomText && (
                <button 
                  onClick={handleApplyEstimate}
                  className="primary-btn" 
                  disabled={applying}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px', marginTop: '8px' }}
                >
                  {applying ? 'Applying...' : 'Apply Effort & Time Estimate'}
                </button>
              )}
            </div>
          )}

          {result.priority && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Recommended Priority</span>
                <span className={`ai-badge ${result.priority.toLowerCase()}`} style={{ fontWeight: 600, fontSize: '14px', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                  {result.priority}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Reasoning</span>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-main)' }}>{result.reasoning}</p>
              </div>
              {onUpdateTask && !useCustomText && (
                <button 
                  onClick={handleApplyPriority}
                  className="primary-btn" 
                  disabled={applying}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px', marginTop: '8px' }}
                >
                  {applying ? 'Applying...' : 'Apply Priority to Task'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getActionLabel = (act) => {
    switch (act) {
      case 'summary': return 'Summarizing...';
      case 'rewrite': return 'Rewriting description...';
      case 'subtasks': return 'Breaking into subtasks...';
      case 'ideas': return 'Generating ideas...';
      case 'estimate': return 'Estimating effort...';
      case 'priority': return 'Determining priority...';
      default: return 'AI is thinking...';
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>AI Assistant</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '20px', gap: '20px', maxHeight: 'calc(90vh - 130px)' }}>
          {/* Context Selector */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', flexShrink: 0 }}>
            <button 
              className={`secondary-btn ${!useCustomText ? 'active' : ''}`}
              onClick={() => { setUseCustomText(false); setResult(null); setError(''); }}
              style={{ 
                flex: 1, 
                fontSize: '13px', 
                padding: '8px', 
                backgroundColor: !useCustomText ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderColor: !useCustomText ? 'var(--primary-color)' : 'var(--border-color)',
                color: !useCustomText ? 'var(--primary-color)' : 'var(--text-muted)'
              }}
            >
              Use Current Task Context
            </button>
            <button 
              className={`secondary-btn ${useCustomText ? 'active' : ''}`}
              onClick={() => { setUseCustomText(true); setResult(null); setError(''); }}
              style={{ 
                flex: 1, 
                fontSize: '13px', 
                padding: '8px', 
                backgroundColor: useCustomText ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderColor: useCustomText ? 'var(--primary-color)' : 'var(--border-color)',
                color: useCustomText ? 'var(--primary-color)' : 'var(--text-muted)'
              }}
            >
              Paste Custom Text
            </button>
          </div>

          {/* Context View or Custom Input */}
          {!useCustomText ? (
            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Context</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600 }}>{task?.title || 'Untitled'}</h4>
              <div 
                style={{ fontSize: '13px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}
                dangerouslySetInnerHTML={{ __html: task?.text || '<i>No description provided</i>' }}
              />
            </div>
          ) : (
            <div style={{ flexShrink: 0 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Custom Text Input</label>
              <textarea 
                className="form-input" 
                placeholder="Paste paragraph or notes to analyze here..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {/* AI Action grid */}
          <div className="ai-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', flexShrink: 0 }}>
            <button 
              className="secondary-btn ai-action-item" 
              onClick={() => handleAction('summary')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px' }}
            >
              <span>✨</span> Summarize
            </button>
            <button 
              className="secondary-btn ai-action-item" 
              onClick={() => handleAction('subtasks')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px' }}
            >
              <span>✅</span> Break into Subtasks
            </button>
            <button 
              className="secondary-btn ai-action-item" 
              onClick={() => handleAction('rewrite')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px' }}
            >
              <span>✍️</span> Rewrite Description
            </button>
            <button 
              className="secondary-btn ai-action-item" 
              onClick={() => handleAction('ideas')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px' }}
            >
              <span>💡</span> Generate Ideas
            </button>
            <button 
              className="secondary-btn ai-action-item" 
              onClick={() => handleAction('estimate')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px' }}
            >
              <span>⏱</span> Estimate Effort
            </button>
            <button 
              className="secondary-btn ai-action-item" 
              onClick={() => handleAction('priority')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px' }}
            >
              <span>🔥</span> Suggest Priority
            </button>
          </div>

          {/* Loader or Error or Output */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '12px', flexShrink: 0 }}>
              <Loader2 size={32} className="ai-loader-spin" style={{ color: 'var(--primary-color)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{getActionLabel(currentAction)}</span>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '14px', flexShrink: 0 }}>
              {error}
            </div>
          )}

          {!loading && !error && renderResult()}
        </div>

        <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
