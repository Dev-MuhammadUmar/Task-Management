import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { gsap } from 'gsap';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

const statusLabels = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({ open: false, mode: 'edit', task: null });
  const [editForm, setEditForm] = useState(initialForm);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const formCardRef = useRef(null);
  const taskListRef = useRef(null);
  const summaryRefs = useRef([]);
  const modalBackdropRef = useRef(null);
  const modalCardRef = useRef(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    const nextToast = { id, message, type };

    setToasts((currentToasts) => [...currentToasts, nextToast]);

    setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const fetchTasks = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data?.data || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong while loading your tasks.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'edit', task: null });
    setModalError('');
    setModalLoading(false);
  };

  const openEditModal = (task) => {
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setModalError('');
    setModalLoading(false);
    setModalState({ open: true, mode: 'edit', task });
  };

  const openDeleteModal = (task) => {
    setModalError('');
    setModalLoading(false);
    setModalState({ open: true, mode: 'delete', task });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (formCardRef.current) {
      gsap.fromTo(
        formCardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  useEffect(() => {
    if (summaryRefs.current.length) {
      gsap.fromTo(
        summaryRefs.current,
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' }
      );
    }
  }, [tasks.length]);

  useEffect(() => {
    if (!taskListRef.current) return;

    const taskCards = taskListRef.current.querySelectorAll('.task-card');

    if (!taskCards.length) return;

    gsap.fromTo(
      taskCards,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, [tasks.length, loading, error]);

  useEffect(() => {
    if (!modalState.open) return;

    const timeline = gsap.timeline();
    timeline
      .fromTo(
        modalBackdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: 'power2.out' }
      )
      .fromTo(
        modalCardRef.current,
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: 'power3.out' },
        '-=0.08'
      );

    return () => timeline.kill();
  }, [modalState.open]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    setFormError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || null,
      };

      const response = await axios.post(`${API_URL}/tasks`, payload);
      setTasks((currentTasks) => [response.data.data, ...currentTasks]);
      setForm(initialForm);
      setSuccessMessage('Task created successfully.');
      showToast('Task added successfully!', 'success');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to create this task.';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (event) => {
    event.preventDefault();

    if (!modalState.task) return;
    if (!editForm.title.trim()) {
      setModalError('Task title is required.');
      return;
    }

    setModalError('');
    setModalLoading(true);

    try {
      const payload = {
        ...editForm,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        dueDate: editForm.dueDate || null,
      };

      const response = await axios.put(`${API_URL}/tasks/${modalState.task._id}`, payload);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === modalState.task._id ? response.data.data : task
        )
      );

      showToast('Task updated successfully!', 'success');
      closeModal();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to update this task.';
      setModalError(message);
      showToast(message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!modalState.task) return;

    setModalError('');
    setModalLoading(true);

    try {
      await axios.delete(`${API_URL}/tasks/${modalState.task._id}`);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== modalState.task._id)
      );
      setSuccessMessage('Task deleted successfully.');
      showToast('Task deleted successfully!', 'success');
      closeModal();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Unable to delete this task.';
      setModalError(message);
      showToast(message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
    };
  }, [tasks]);

  const formatDate = (value) => {
    if (!value) return 'No due date';

    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="app-shell">
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {modalState.open ? (
        <div
          className="modal-backdrop"
          ref={modalBackdropRef}
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="modal-card"
            ref={modalCardRef}
            onClick={(event) => event.stopPropagation()}
          >
            {modalState.mode === 'edit' ? (
              <>
                <div className="modal-header">
                  <h3>Edit task</h3>
                  <button type="button" className="close-button" onClick={closeModal}>
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdateTask} className="task-form modal-form">
                  <label>
                    <span>Title</span>
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditInputChange}
                      placeholder="Write a task title"
                    />
                  </label>

                  <label>
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditInputChange}
                      rows="4"
                      placeholder="Add more details"
                    />
                  </label>

                  <div className="inline-fields">
                    <label>
                      <span>Status</span>
                      <select
                        name="status"
                        value={editForm.status}
                        onChange={handleEditInputChange}
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </label>

                    <label>
                      <span>Priority</span>
                      <select
                        name="priority"
                        value={editForm.priority}
                        onChange={handleEditInputChange}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    <span>Due date</span>
                    <input
                      type="date"
                      name="dueDate"
                      value={editForm.dueDate}
                      onChange={handleEditInputChange}
                    />
                  </label>

                  {modalError ? <p className="form-message error">{modalError}</p> : null}

                  <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button modal-submit" disabled={modalLoading}>
                      {modalLoading ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Delete task</h3>
                  <button type="button" className="close-button" onClick={closeModal}>
                    ×
                  </button>
                </div>

                <p className="modal-warning">
                  Are you sure you want to delete <strong>{modalState.task?.title}</strong>?
                </p>

                {modalError ? <p className="form-message error">{modalError}</p> : null}

                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={handleDeleteTask}
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Deleting...' : 'Delete task'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <header className="topbar">
        <div>
          <p className="eyebrow">Productivity</p>
          <h1>Task Management</h1>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={() => fetchTasks({ silent: true })}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <section className="summary-grid" aria-label="Task overview">
        <div
          ref={(el) => {
            summaryRefs.current[0] = el;
          }}
          className="summary-card"
        >
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div
          ref={(el) => {
            summaryRefs.current[1] = el;
          }}
          className="summary-card"
        >
          <span>To do</span>
          <strong>{summary.todo}</strong>
        </div>
        <div
          ref={(el) => {
            summaryRefs.current[2] = el;
          }}
          className="summary-card"
        >
          <span>In progress</span>
          <strong>{summary.inProgress}</strong>
        </div>
        <div
          ref={(el) => {
            summaryRefs.current[3] = el;
          }}
          className="summary-card"
        >
          <span>Done</span>
          <strong>{summary.done}</strong>
        </div>
      </section>

      <div className="content-grid">
        <aside className="form-card" ref={formCardRef}>
          <h2>Create task</h2>

          <form onSubmit={handleCreateTask} className="task-form">
            <label>
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Write a task title"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Add more details"
              />
            </label>

            <div className="inline-fields">
              <label>
                <span>Status</span>
                <select name="status" value={form.status} onChange={handleInputChange}>
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </label>

              <label>
                <span>Priority</span>
                <select name="priority" value={form.priority} onChange={handleInputChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <label>
              <span>Due date</span>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleInputChange}
              />
            </label>

            {formError ? <p className="form-message error">{formError}</p> : null}
            {successMessage ? (
              <p className="form-message success">{successMessage}</p>
            ) : null}

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Creating task...' : 'Create task'}
            </button>
          </form>
        </aside>

        <main className="task-panel">
          {loading ? (
            <div className="state-box loading-box" role="status" aria-live="polite">
              Loading tasks...
            </div>
          ) : error ? (
            <div className="state-box error-box" role="alert">
              <strong>Unable to load tasks.</strong>
              <p>{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="state-box empty-box">
              <strong>No tasks yet.</strong>
              <p>Create your first task to get started.</p>
            </div>
          ) : (
            <div className="task-list" ref={taskListRef} aria-live="polite">
              {tasks.map((task) => (
                <article key={task._id} className="task-card">
                  <div className="task-header">
                    <h2>{task.title}</h2>
                    <span className={`badge badge-${task.status}`}>
                      {statusLabels[task.status] || task.status}
                    </span>
                  </div>

                  <p className="task-description">
                    {task.description || 'No description added.'}
                  </p>

                  <div className="task-meta">
                    <span className={`badge badge-priority badge-${task.priority}`}>
                      {priorityLabels[task.priority] || task.priority}
                    </span>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => openEditModal(task)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => openDeleteModal(task)}
                      disabled={deletingId === task._id}
                    >
                      {deletingId === task._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
