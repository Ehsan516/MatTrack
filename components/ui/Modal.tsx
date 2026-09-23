import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon, { IconName } from './Icon';

interface ModalProps {
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  icon?: IconName;
  tone?: 'blue' | 'danger';
  children?: React.ReactNode;
  /** Wraps the body in a <form> so Enter submits. */
  onSubmit?: (e: React.FormEvent) => void;
}

/** Centered dialog on desktop, bottom sheet on phones. Closes on Escape or backdrop click. */
const Modal: React.FC<ModalProps> = ({ onClose, title, description, icon, tone = 'blue', children, onSubmit }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content = (
    <>
      <div className="modal-top">
        {icon && (
          <div className={`modal-icon ${tone === 'blue' ? 'blue' : ''}`}>
            <Icon name={icon} size={22} />
          </div>
        )}
        <h3 className="modal-title">{title}</h3>
        {description && <p className="modal-desc">{description}</p>}
        <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="modal-body col gap-3">{children}</div>
    </>
  );

  return createPortal(
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      {onSubmit ? (
        <form className="modal" role="dialog" aria-modal="true" aria-label={title} onSubmit={onSubmit}>{content}</form>
      ) : (
        <div className="modal" role="dialog" aria-modal="true" aria-label={title}>{content}</div>
      )}
    </div>,
    document.body
  );
};

export default Modal;
