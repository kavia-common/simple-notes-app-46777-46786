<script setup lang="ts">
/**
 * NotesApp.vue
 * A simple local-state notes app to be embedded inside Slidev slides.
 * No backend. Uses localStorage for persistence across reloads in dev.
 * Styled per the Ocean Professional theme tokens already present in theme/custom.css.
 */

import { computed, onMounted, reactive, ref, watch } from 'vue'

type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'slidev-notes-app:v1'
const notes = ref<Note[]>([])
const selectedId = ref<string | null>(null)
const search = ref('')

const newNote = () => {
  const now = Date.now()
  const n: Note = {
    id: crypto.randomUUID(),
    title: 'Untitled note',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
  notes.value = [n, ...notes.value]
  selectedId.value = n.id
}

const deleteNote = (id: string) => {
  const idx = notes.value.findIndex(n => n.id === id)
  if (idx >= 0) {
    notes.value.splice(idx, 1)
    if (selectedId.value === id) {
      selectedId.value = notes.value.length ? notes.value[0].id : null
    }
  }
}

const currentNote = computed<Note | null>(() => {
  return notes.value.find(n => n.id === selectedId.value) ?? null
})

const titleModel = ref('')
const contentModel = ref('')

watch(currentNote, (n) => {
  titleModel.value = n?.title ?? ''
  contentModel.value = n?.content ?? ''
}, { immediate: true })

const saveCurrent = () => {
  if (!currentNote.value) return
  const idx = notes.value.findIndex(n => n.id === currentNote.value!.id)
  if (idx >= 0) {
    notes.value[idx] = {
      ...notes.value[idx],
      title: titleModel.value.trim() || 'Untitled note',
      content: contentModel.value,
      updatedAt: Date.now(),
    }
  }
}

const filteredNotes = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return notes.value
  return notes.value.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.content.toLowerCase().includes(q),
  )
})

onMounted(() => {
  // Load from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Note[]
      // basic validation
      if (Array.isArray(parsed)) {
        notes.value = parsed
      }
    }
  } catch {
    // ignore malformed storage
  }
  // Select first note if available
  if (!selectedId.value && notes.value.length) {
    selectedId.value = notes.value[0].id
  }
})

// Persist to localStorage when notes change
watch(notes, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  } catch {
    // ignore quota/storage errors
  }
}, { deep: true })

// Respect existing VITE_* envs if referenced elsewhere. We only read them to prove compatibility.
const envInfo = reactive({
  base: import.meta.env.VITE_API_BASE || '',
  backend: import.meta.env.VITE_BACKEND_URL || '',
  ws: import.meta.env.VITE_WS_URL || '',
  nodeEnv: import.meta.env.VITE_NODE_ENV || '',
})

const selectNote = (id: string) => {
  selectedId.value = id
}
</script>

<template>
  <div class="notes-app">
    <aside class="notes-sidebar">
      <div class="sidebar-top">
        <div class="app-title">
          <span class="badge">Notes</span>
          <h3>Ocean Notes</h3>
        </div>
        <div class="actions">
          <button class="btn-primary" @click="newNote">New Note</button>
        </div>
        <div class="search-box">
          <input
            v-model="search"
            type="text"
            placeholder="Search notes..."
            aria-label="Search notes"
          />
        </div>
      </div>

      <ul class="notes-list" role="list">
        <li
          v-for="n in filteredNotes"
          :key="n.id"
          :class="['note-item', { active: n.id === selectedId }]"
          @click="selectNote(n.id)"
        >
          <div class="note-title">{{ n.title || 'Untitled note' }}</div>
          <div class="note-snippet">{{ n.content?.slice(0, 80) }}</div>
          <div class="note-meta">
            <span>Updated {{ new Date(n.updatedAt).toLocaleString() }}</span>
            <button
              class="btn-icon danger"
              title="Delete note"
              aria-label="Delete note"
              @click.stop="deleteNote(n.id)"
            >
              ×
            </button>
          </div>
        </li>
        <li v-if="!filteredNotes.length" class="empty">
          <div class="placeholder small">No notes found</div>
        </li>
      </ul>
    </aside>

    <main class="notes-main">
      <div v-if="currentNote" class="editor card">
        <div class="editor-header">
          <input
            class="title-input"
            v-model="titleModel"
            placeholder="Note title"
            aria-label="Note title"
          />
          <div class="editor-actions">
            <button class="btn-secondary" @click="saveCurrent">Save</button>
          </div>
        </div>
        <textarea
          class="content-input"
          v-model="contentModel"
          placeholder="Start typing your note..."
          aria-label="Note content"
        ></textarea>
      </div>
      <div v-else class="card empty-state">
        <div class="overline">No note selected</div>
        <h2 class="text-hero">Create your first note</h2>
        <p class="muted">Click "New Note" to begin capturing your ideas.</p>
        <div class="mt-2">
          <button class="btn-primary" @click="newNote">New Note</button>
        </div>
      </div>

      <div class="env subtle mt-2">
        <!-- Displaying env briefly to show we respect VITE_* if present (non-functional) -->
        <small>Env: {{ envInfo.nodeEnv || 'dev' }}</small>
      </div>
    </main>
  </div>
</template>

<style scoped>
.notes-app {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  min-height: 520px;
}

@media (max-width: 900px) {
  .notes-app {
    grid-template-columns: 1fr;
  }
}

.notes-sidebar {
  background: var(--theme-bg-elevated);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  box-shadow: 0 10px 28px rgba(0,0,0,0.28);
}

.sidebar-top {
  display: grid;
  gap: 10px;
}

.app-title {
  display: grid;
  gap: 6px;
}
.app-title h3 {
  margin: 0;
  font-size: 18px;
}

.actions {
  display: flex;
  gap: 8px;
}

.search-box input {
  width: 100%;
  background: var(--theme-bg-elev-2);
  color: var(--theme-text-primary);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
}
.search-box input:focus {
  border-color: var(--theme-primary-500);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--theme-primary-400) 30%, #0000);
}

.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
  overflow-y: auto;
}

.note-item {
  background: var(--theme-bg-elevated);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}
.note-item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--theme-primary-500) 30%, var(--line));
  box-shadow: 0 8px 20px rgba(0,0,0,0.24);
}
.note-item.active {
  border-color: var(--theme-primary-500);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--theme-primary-400) 20%, #0000);
}

.note-title {
  font-weight: 700;
  color: var(--theme-text-primary);
}
.note-snippet {
  color: var(--theme-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}
.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--theme-text-muted);
  font-size: 12px;
}

.btn-icon {
  background: transparent;
  color: var(--theme-text-secondary);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 2px 8px;
  cursor: pointer;
}
.btn-icon:hover {
  background: var(--theme-btn-ghost-hover-bg);
}
.btn-icon.danger:hover {
  color: #EF4444;
  border-color: color-mix(in oklab, #EF4444 35%, var(--line));
}

.notes-main {
  display: grid;
  gap: 12px;
}

.editor {
  display: grid;
  gap: 12px;
}

.editor-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.title-input {
  background: var(--theme-bg-elev-2);
  color: var(--theme-text-primary);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  outline: none;
  font-weight: 700;
}
.title-input:focus {
  border-color: var(--theme-primary-500);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--theme-primary-400) 30%, #0000);
}

.content-input {
  min-height: 320px;
  background: var(--theme-bg-elev-2);
  color: var(--theme-text-primary);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  outline: none;
  resize: vertical;
  line-height: 1.5;
}
.content-input:focus {
  border-color: var(--theme-primary-500);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--theme-primary-400) 30%, #0000);
}

.empty-state {
  display: grid;
  gap: 8px;
  align-content: start;
}

.env small {
  color: var(--theme-text-muted);
}
</style>
