'use client'

import { useState, useEffect } from 'react'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_OF_WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Priority = 1 | 2 | 3
type Status = 'todo' | 'inprogress' | 'done'
type CalendarView = 'month' | 'week' | 'day'
type MainView = 'tasks' | 'calendar'
type TaskFilter = 'all' | 'high' | 'inprogress' | 'overdue'

interface Task {
  id: number
  title: string
  date: string | null
  priority: Priority
  status: Status
  time: string | null
  description: string | null
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function Home() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [mainView, setMainView] = useState<MainView>('tasks')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    all: true,
    overdue: true,
    today: true,
    unscheduled: true,
    upcoming: true,
    completed: true,
  })
  const [taskSearch, setTaskSearch] = useState('')
  const [showFabModal, setShowFabModal] = useState(false)
  const [fabTaskTitle, setFabTaskTitle] = useState('')
  const [fabTaskDate, setFabTaskDate] = useState('')
  const [fabTaskPriority, setFabTaskPriority] = useState<Priority>(2)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('taskcalendar-tasks')
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (e) {
        console.error('Failed to parse saved tasks:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('taskcalendar-tasks', JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  const year = viewYear
  const month = viewMonth

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewMonth(today.getMonth())
    setViewYear(today.getFullYear())
    setViewDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  }

  const getWeekDays = () => {
    const weekStart = getWeekStart(viewDate)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      days.push(d)
    }
    return days
  }

  const goToPrevWeek = () => {
    const newDate = new Date(viewDate)
    newDate.setDate(viewDate.getDate() - 7)
    setViewDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(viewDate)
    newDate.setDate(viewDate.getDate() + 7)
    setViewDate(newDate)
  }

  const goToPrevDay = () => {
    const newDate = new Date(viewDate)
    newDate.setDate(viewDate.getDate() - 1)
    setViewDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(viewDate)
    newDate.setDate(viewDate.getDate() + 1)
    setViewDate(newDate)
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const getTasksForHour = (dateKey: string, hour: number) => {
    return tasks.filter((t) => {
      if (t.date !== dateKey) return false
      if (!t.time) return hour === 0
      const taskHour = parseInt(t.time.split(':')[0], 10)
      return taskHour === hour
    })
  }

  const getTasksWithoutTime = (dateKey: string) => {
    return tasks.filter((t) => t.date === dateKey && !t.time)
  }

  const yearOptions = []
  for (let y = viewYear - 50; y <= viewYear + 50; y++) {
    yearOptions.push(y)
  }

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const todayKey = formatDateKey(today)

  // Task categorization helpers
  const getUnscheduledTasks = () => {
    return tasks.filter(t => !t.date && t.status !== 'done')
  }

  const getTodayTasks = () => {
    return tasks.filter(t => t.date === todayKey && t.status !== 'done')
  }

  const getUpcomingTasks = () => {
    return tasks.filter(t => {
      if (!t.date || t.status === 'done') return false
      return t.date > todayKey
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }

  const getOverdueTasks = () => {
    return tasks.filter(t => {
      if (!t.date || t.status === 'done') return false
      return t.date < todayKey
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }

  const getCompletedTasks = () => {
    return tasks.filter(t => t.status === 'done')
  }

  const getAllTasks = () => {
    return [...tasks].sort((a, b) => {
      // Sort by date (null dates last), then by priority (high first)
      if (a.date && b.date) return a.date.localeCompare(b.date)
      if (a.date) return -1
      if (b.date) return 1
      return b.priority - a.priority
    })
  }

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const allSectionKeys = ['all', 'overdue', 'today', 'unscheduled', 'upcoming', 'completed']
  const allCollapsed = allSectionKeys.every(key => collapsedSections[key])

  const toggleAllSections = () => {
    const newState: Record<string, boolean> = {}
    allSectionKeys.forEach(key => {
      newState[key] = !allCollapsed
    })
    setCollapsedSections(newState)
  }

  const filterTasks = (taskList: Task[]) => {
    let filtered = taskList

    if (taskSearch.trim()) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(taskSearch.toLowerCase())
      )
    }

    switch (taskFilter) {
      case 'high':
        return filtered.filter(t => t.priority === 3)
      case 'inprogress':
        return filtered.filter(t => t.status === 'inprogress')
      case 'overdue':
        return filtered.filter(t => t.date && t.date < todayKey && t.status !== 'done')
      default:
        return filtered
    }
  }

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day))
  }

  const addTask = (forDate?: string) => {
    if (!newTaskTitle.trim()) return
    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      date: forDate || null,
      priority: 2,
      status: 'todo',
      time: null,
      description: null,
    }
    setTasks([...tasks, newTask])
    setNewTaskTitle('')
  }

  const addTaskFromFab = () => {
    if (!fabTaskTitle.trim()) return
    const newTask: Task = {
      id: Date.now(),
      title: fabTaskTitle.trim(),
      date: fabTaskDate || null,
      priority: fabTaskPriority,
      status: 'todo',
      time: null,
      description: null,
    }
    setTasks([...tasks, newTask])
    setFabTaskTitle('')
    setFabTaskDate('')
    setFabTaskPriority(2)
    setShowFabModal(false)
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id))
    if (expandedTaskId === id) setExpandedTaskId(null)
  }

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const toggleTaskStatus = (id: number) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const nextStatus: Status =
      task.status === 'todo' ? 'inprogress' : task.status === 'inprogress' ? 'done' : 'todo'
    updateTask(id, { status: nextStatus })
  }

  const assignTaskToDate = (taskId: number) => {
    if (!selectedDate) return
    updateTask(taskId, { date: formatDateKey(selectedDate) })
  }

  const unassignTask = (taskId: number) => {
    updateTask(taskId, { date: null })
  }

  const handleDragStart = (taskId: number) => {
    setDraggedTaskId(taskId)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
  }

  const handleDrop = (dateKey: string) => {
    if (draggedTaskId) {
      updateTask(draggedTaskId, { date: dateKey })
      setDraggedTaskId(null)
    }
  }

  const getPriorityLabel = (p: Priority) => {
    return p === 1 ? 'Low' : p === 2 ? 'Medium' : 'High'
  }

  const getStatusLabel = (s: Status) => {
    return s === 'todo' ? 'To Do' : s === 'inprogress' ? 'In Progress' : 'Done'
  }

  const getTasksForDate = (dateKey: string) => {
    return tasks.filter((t) => t.date === dateKey)
  }

  const days: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // Render a single task item
  const renderTaskItem = (task: Task, showDate = true) => (
    <div
      key={task.id}
      className={`task-item priority-${task.priority} status-${task.status} ${draggedTaskId === task.id ? 'dragging' : ''}`}
      draggable
      onDragStart={() => handleDragStart(task.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="task-main" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
        <button
          className={`status-checkbox status-${task.status}`}
          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id) }}
          title={getStatusLabel(task.status)}
        />
        <div className="task-info">
          <span className={`task-title ${task.status === 'done' ? 'completed' : ''}`}>
            {task.title}
          </span>
          <div className="task-meta">
            <span className={`priority-badge priority-${task.priority}`}>
              {getPriorityLabel(task.priority)}
            </span>
            {task.date && task.date < todayKey && task.status !== 'done' && (
              <span className="overdue-badge">Overdue</span>
            )}
            {showDate && task.date && <span className="date-badge">{task.date}</span>}
            {task.time && <span className="time-badge">{task.time}</span>}
          </div>
        </div>
      </div>
      {expandedTaskId === task.id && (
        <div className="task-expanded">
          <textarea
            value={task.description || ''}
            onChange={(e) => updateTask(task.id, { description: e.target.value || null })}
            placeholder="Add description..."
            rows={2}
          />
          <div className="task-edit-row">
            <select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: Number(e.target.value) as Priority })}
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as Status })}
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="task-edit-row">
            <input
              type="date"
              value={task.date || ''}
              onChange={(e) => updateTask(task.id, { date: e.target.value || null })}
            />
            <input
              type="time"
              value={task.time || ''}
              onChange={(e) => updateTask(task.id, { time: e.target.value || null })}
            />
          </div>
          <div className="task-actions">
            <button onClick={() => deleteTask(task.id)} className="delete-btn">Delete</button>
          </div>
        </div>
      )}
    </div>
  )

  // Render a collapsible task section
  const renderTaskSection = (title: string, icon: string, taskList: Task[], sectionKey: string, showDate = true) => {
    const filteredTasks = filterTasks(taskList)
    if (filteredTasks.length === 0 && taskFilter !== 'all') return null

    return (
      <div className="task-section">
        <div
          className="task-section-header"
          onClick={() => toggleSection(sectionKey)}
        >
          <span className="task-section-icon">{icon}</span>
          <span className="task-section-title">{title}</span>
          <span className="task-section-count">{filteredTasks.length}</span>
          <span className={`task-section-chevron ${collapsedSections[sectionKey] ? 'collapsed' : ''}`}>
            ▼
          </span>
        </div>
        {!collapsedSections[sectionKey] && (
          <div className="task-section-list">
            {filteredTasks.length === 0 ? (
              <p className="no-tasks-hint">No tasks</p>
            ) : (
              filteredTasks.map(task => renderTaskItem(task, showDate))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className={`dashboard ${draggedTaskId ? 'is-dragging' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">Jantzen's Dash</h1>
        <button onClick={goToToday} className="today-btn header-today">Today</button>
        <nav className="main-nav mobile-nav">
          <button
            className={`main-nav-btn ${mainView === 'tasks' ? 'active' : ''}`}
            onClick={() => setMainView('tasks')}
          >
            Tasks
          </button>
          <button
            className={`main-nav-btn ${mainView === 'calendar' ? 'active' : ''}`}
            onClick={() => setMainView('calendar')}
          >
            Calendar
          </button>
        </nav>
      </header>

      <div className="dashboard-content">
        {/* Tasks Panel */}
        <div className={`tasks-panel ${mainView === 'tasks' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="panel-header">
            <h2>Tasks</h2>
            <span className="task-count">{tasks.filter(t => t.status !== 'done').length} active</span>
            <button
              className="collapse-all-btn"
              onClick={toggleAllSections}
              title={allCollapsed ? 'Expand all sections' : 'Collapse all sections'}
            >
              {allCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          </div>

          <div className="quick-add">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a task..."
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <button onClick={() => addTask()}>Add</button>
          </div>

          <div className="task-filters">
            <input
              type="text"
              className="task-search"
              placeholder="Search tasks..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            <div className="filter-pills">
              {(['all', 'high', 'inprogress', 'overdue'] as TaskFilter[]).map(filter => (
                <button
                  key={filter}
                  className={`filter-pill ${taskFilter === filter ? 'active' : ''}`}
                  onClick={() => setTaskFilter(filter)}
                >
                  {filter === 'all' ? 'All' : filter === 'high' ? 'High Priority' : filter === 'inprogress' ? 'In Progress' : 'Overdue'}
                </button>
              ))}
            </div>
          </div>

          <div className="task-sections">
            {renderTaskSection('All Tasks', '▤', getAllTasks(), 'all')}
            {renderTaskSection('Overdue', '!', getOverdueTasks(), 'overdue')}
            {renderTaskSection('Today', '★', getTodayTasks(), 'today', false)}
            {renderTaskSection('Unscheduled', '○', getUnscheduledTasks(), 'unscheduled')}
            {renderTaskSection('Upcoming', '→', getUpcomingTasks(), 'upcoming')}
            {renderTaskSection('Completed', '✓', getCompletedTasks(), 'completed')}
          </div>
        </div>

        {/* Calendar Panel */}
        <div className={`calendar-panel ${mainView === 'calendar' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="calendar">
        <div className="calendar-header">
          <div className="view-switcher">
            <button
              className={`view-btn ${calendarView === 'month' ? 'active' : ''}`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
            <button
              className={`view-btn ${calendarView === 'week' ? 'active' : ''}`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
            <button
              className={`view-btn ${calendarView === 'day' ? 'active' : ''}`}
              onClick={() => setCalendarView('day')}
            >
              Day
            </button>
          </div>

          {calendarView === 'month' && (
            <div className="calendar-nav">
              <button onClick={goToPrevMonth} className="nav-btn">&lt;</button>
              <div className="calendar-selects">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={goToNextMonth} className="nav-btn">&gt;</button>
            </div>
          )}

          {calendarView === 'week' && (
            <div className="calendar-nav">
              <button onClick={goToPrevWeek} className="nav-btn">&lt;</button>
              <span className="nav-label">
                {getWeekDays()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {getWeekDays()[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={goToNextWeek} className="nav-btn">&gt;</button>
            </div>
          )}

          {calendarView === 'day' && (
            <div className="calendar-nav">
              <button onClick={goToPrevDay} className="nav-btn">&lt;</button>
              <span className="nav-label">
                {DAYS_OF_WEEK_FULL[viewDate.getDay()]}, {MONTHS[viewDate.getMonth()]} {viewDate.getDate()}, {viewDate.getFullYear()}
              </span>
              <button onClick={goToNextDay} className="nav-btn">&gt;</button>
            </div>
          )}

          <button onClick={goToToday} className="today-btn">Today</button>
        </div>

        {calendarView === 'month' && (
          <div className="calendar-grid">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="day-label">{day}</div>
            ))}

            {days.map((day, index) => {
              const dateKey = day ? formatDateKey(new Date(year, month, day)) : null
              const dayTasks = dateKey ? getTasksForDate(dateKey) : []
              const isSelected = selectedDate && dateKey === formatDateKey(selectedDate)
              const isToday = dateKey === formatDateKey(today)
              return (
                <div
                  key={index}
                  className={`day-cell ${day === null ? 'empty' : ''} ${
                    isSelected ? 'selected' : ''
                  } ${isToday && !isSelected ? 'today' : ''} ${draggedTaskId && day !== null ? 'drop-target' : ''}`}
                  onClick={() => day !== null && handleDayClick(day)}
                  onDragOver={(e) => { if (day !== null) e.preventDefault() }}
                  onDrop={() => { if (dateKey) handleDrop(dateKey) }}
                >
                  {day}
                  {dayTasks.length > 0 && (
                    <span className="task-indicator">{dayTasks.length}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {calendarView === 'week' && (
          <div className="week-view">
            <div className="week-header">
              {getWeekDays().map((day) => {
                const dateKey = formatDateKey(day)
                const isToday = dateKey === formatDateKey(today)
                const isSelected = selectedDate && dateKey === formatDateKey(selectedDate)
                return (
                  <div
                    key={dateKey}
                    className={`week-day-header ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className="week-day-name">{DAYS_OF_WEEK[day.getDay()]}</span>
                    <span className="week-day-number">{day.getDate()}</span>
                  </div>
                )
              })}
            </div>
            <div className="week-body">
              {getWeekDays().map((day) => {
                const dateKey = formatDateKey(day)
                const dayTasks = getTasksForDate(dateKey)
                const isToday = dateKey === formatDateKey(today)
                return (
                  <div
                    key={dateKey}
                    className={`week-day-column ${isToday ? 'today' : ''} ${draggedTaskId ? 'drop-target' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(dateKey)}
                    onClick={() => setSelectedDate(day)}
                  >
                    {dayTasks.length === 0 ? (
                      <span className="no-tasks-indicator">No tasks</span>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`week-task priority-${task.priority} status-${task.status}`}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDate(day)
                          }}
                        >
                          <span className="week-task-title">{task.title}</span>
                          {task.time && <span className="week-task-time">{task.time}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {calendarView === 'day' && (
          <div className="day-view">
            <div className="day-all-day">
              <div className="day-time-label">All Day</div>
              <div
                className={`day-all-day-content ${draggedTaskId ? 'drop-target' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(formatDateKey(viewDate))}
              >
                {getTasksWithoutTime(formatDateKey(viewDate)).map((task) => (
                  <div
                    key={task.id}
                    className={`day-task priority-${task.priority} status-${task.status}`}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <button
                      className={`status-checkbox status-${task.status}`}
                      onClick={() => toggleTaskStatus(task.id)}
                      title={getStatusLabel(task.status)}
                    />
                    <span className={`day-task-title ${task.status === 'done' ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="day-hours">
              {HOURS.map((hour) => {
                const hourTasks = tasks.filter((t) => {
                  if (t.date !== formatDateKey(viewDate)) return false
                  if (!t.time) return false
                  const taskHour = parseInt(t.time.split(':')[0], 10)
                  return taskHour === hour
                })
                return (
                  <div key={hour} className="day-hour-row">
                    <div className="day-time-label">{formatHour(hour)}</div>
                    <div
                      className={`day-hour-content ${draggedTaskId ? 'drop-target' : ''}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedTaskId) {
                          updateTask(draggedTaskId, {
                            date: formatDateKey(viewDate),
                            time: `${String(hour).padStart(2, '0')}:00`
                          })
                          setDraggedTaskId(null)
                        }
                      }}
                    >
                      {hourTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`day-task priority-${task.priority} status-${task.status}`}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <button
                            className={`status-checkbox status-${task.status}`}
                            onClick={() => toggleTaskStatus(task.id)}
                            title={getStatusLabel(task.status)}
                          />
                          <span className={`day-task-title ${task.status === 'done' ? 'completed' : ''}`}>
                            {task.title}
                          </span>
                          <span className="day-task-time">{task.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

          </div>

          {/* Selected Date Detail Panel */}
          {selectedDate && (
            <div className="selected-date-panel">
              <div className="selected-date-header">
                <h3>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <button className="close-btn" onClick={() => setSelectedDate(null)}>×</button>
              </div>
              <div className="selected-date-add">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add task for this date..."
                  onKeyDown={(e) => e.key === 'Enter' && addTask(formatDateKey(selectedDate))}
                />
                <button onClick={() => addTask(formatDateKey(selectedDate))}>Add</button>
              </div>
              <div className="selected-date-tasks">
                {getTasksForDate(formatDateKey(selectedDate)).length === 0 ? (
                  <p className="no-tasks-hint">No tasks for this date. Drag tasks here or add one above.</p>
                ) : (
                  getTasksForDate(formatDateKey(selectedDate)).map(task => (
                    <div key={task.id} className={`date-task-item priority-${task.priority} status-${task.status}`}>
                      <button
                        className={`status-checkbox status-${task.status}`}
                        onClick={() => toggleTaskStatus(task.id)}
                        title={getStatusLabel(task.status)}
                      />
                      <div className="date-task-info">
                        <span className={`date-task-title ${task.status === 'done' ? 'completed' : ''}`}>
                          {task.title}
                        </span>
                        {task.time && <span className="time-badge">{task.time}</span>}
                      </div>
                      <button onClick={() => unassignTask(task.id)} className="unassign-btn" title="Remove from date">×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setShowFabModal(true)}
        aria-label="Add new task"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* FAB Modal */}
      {showFabModal && (
        <div className="fab-modal-overlay" onClick={() => setShowFabModal(false)}>
          <div className="fab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fab-modal-header">
              <h3>New Task</h3>
              <button className="close-btn" onClick={() => setShowFabModal(false)}>×</button>
            </div>
            <div className="fab-modal-body">
              <input
                type="text"
                value={fabTaskTitle}
                onChange={(e) => setFabTaskTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addTaskFromFab()}
              />
              <div className="fab-modal-row">
                <input
                  type="date"
                  value={fabTaskDate}
                  onChange={(e) => setFabTaskDate(e.target.value)}
                />
                <select
                  value={fabTaskPriority}
                  onChange={(e) => setFabTaskPriority(Number(e.target.value) as Priority)}
                >
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                </select>
              </div>
              <button className="fab-modal-submit" onClick={addTaskFromFab}>
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-btn ${mainView === 'tasks' ? 'active' : ''}`}
          onClick={() => setMainView('tasks')}
        >
          <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span>Tasks</span>
        </button>
        <button
          className={`bottom-nav-btn ${mainView === 'calendar' ? 'active' : ''}`}
          onClick={() => setMainView('calendar')}
        >
          <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Calendar</span>
        </button>
      </nav>
    </main>
  )
}
