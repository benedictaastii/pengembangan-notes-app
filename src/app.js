import {
  getAllNotes,
  addNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
} from './api.js';
import './styles.css';
import Swal from 'sweetalert2';
import anime from 'animejs/lib/anime.es.js';

let notes = [];

class LoadingIndicator extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
      </div>
    `;
  }
}

customElements.define('loading-indicator', LoadingIndicator);

class NoteItem extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const note = notes.find((n) => n.id === this.getAttribute('id'));
    const formattedDate = formatDate(note.createdAt);

    this.innerHTML = `
      <div class="note-item">
        <h3>${note.title}</h3>
        <p>${note.body}</p>
        <p>Dibuat: ${formattedDate}</p>
        <button class="delete-button" data-id="${note.id}">Hapus</button>
        <button class="archive-button" data-id="${note.id}">
          ${note.archived ? 'Pindahkan' : 'Arsipkan'}
        </button>
      </div>
    `;

    this.querySelector('.delete-button').addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
        this.dispatchEvent(
          new CustomEvent('delete-note', {
            detail: { id: note.id },
            bubbles: true,
          })
        );
      }
    });

    this.querySelector('.archive-button').addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('archive-note', {
          detail: { id: note.id },
          bubbles: true,
        })
      );
    });
  }
}

class AddNoteForm extends HTMLElement {
  constructor() {
    super();
    this.maxChar = 50;
  }

  static get observedAttributes() {
    return ["max-char"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "max-char") {
      this.maxChar = parseInt(newValue, 10);
    }
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.innerHTML = `
      <form id="addNoteForm">
        <div class="title-input-container">
          <input type="text" id="titleInput" placeholder="Judul" required>
          <span id="charCount">0/${this.maxChar}</span>
        </div>
        <div id="titleError" class="error"></div>
        <textarea id="bodyInput" placeholder="Isi catatan" required></textarea>
        <div id="bodyError" class="error"></div>
        <button type="submit">Tambah Catatan</button>
      </form>
    `;
  }

  addEventListeners() {
    const form = this.querySelector("form");
    const titleInput = this.querySelector("#titleInput");
    const bodyInput = this.querySelector("#bodyInput");
    const charCount = this.querySelector("#charCount");
    const titleError = this.querySelector("#titleError");
    const bodyError = this.querySelector("#bodyError");

    titleInput.addEventListener("input", () => {
      const remaining = this.maxChar - titleInput.value.length;
      charCount.textContent = `${titleInput.value.length}/${this.maxChar}`;

      if (remaining < 0) {
        titleError.textContent = `Judul melebihi batas maksimum ${this.maxChar} karakter`;
      } else {
        titleError.textContent = "";
      }
    });

    bodyInput.addEventListener("input", () => {
      if (bodyInput.value.trim() === "") {
        bodyError.textContent = "Isi catatan tidak boleh kosong";
      } else {
        bodyError.textContent = "";
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this.validateForm()) {
        this.dispatchEvent(
          new CustomEvent("add-note", {
            detail: { title: titleInput.value, body: bodyInput.value },
            bubbles: true,
          })
        );
        form.reset();
        charCount.textContent = `0/${this.maxChar}`;
      }
    });
  }

  validateForm() {
    const titleInput = this.querySelector("#titleInput");
    const bodyInput = this.querySelector("#bodyInput");
    const titleError = this.querySelector("#titleError");
    const bodyError = this.querySelector("#bodyError");

    let isValid = true;

    if (titleInput.value.length > this.maxChar) {
      titleError.textContent = `Judul melebihi batas maksimum ${this.maxChar} karakter`;
      isValid = false;
    } else {
      titleError.textContent = "";
    }

    if (bodyInput.value.trim() === "") {
      bodyError.textContent = "Isi catatan tidak boleh kosong";
      isValid = false;
    } else {
      bodyError.textContent = "";
    }

    return isValid;
  }
}


class SearchBar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Cari catatan...">
      </div>
    `;
  }

  addEventListeners() {
    const searchInput = this.querySelector('#searchInput');
    searchInput.addEventListener('input', () => {
      this.dispatchEvent(
        new CustomEvent('search-notes', {
          detail: { searchTerm: searchInput.value },
          bubbles: true,
        })
      );
    });
  }
}

customElements.define('note-item', NoteItem);
customElements.define('add-note-form', AddNoteForm);
customElements.define('search-bar', SearchBar);

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function animateNewNote(element) {
  anime({
    targets: element,
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 800,
    easing: 'easeOutElastic(1, .8)',
  });
}

async function renderNotes(filteredNotes = null) {
  const activeNoteList = document.querySelector('#activeNotes');
  const archivedNoteList = document.querySelector('#archivedNotes');

  const notesToRender = filteredNotes || notes;

  if (activeNoteList) {
    activeNoteList.innerHTML = `
      <h2>Catatan Aktif</h2>
      <div class="note-list">
        ${notesToRender
          .filter((note) => !note.archived)
          .map((note) => `<note-item id="${note.id}"></note-item>`)
          .join('')}
      </div>
    `;
  }
  if (archivedNoteList) {
    archivedNoteList.innerHTML = `
      <h2>Catatan Arsip</h2>
      <div class="note-list">
        ${notesToRender
          .filter((note) => note.archived)
          .map((note) => `<note-item id="${note.id}"></note-item>`)
          .join('')}
      </div>
    `;
  }

  // animasi catatan baru
  document.querySelectorAll('.note-item').forEach(animateNewNote);
}

document.addEventListener('DOMContentLoaded', async () => {
  const loadingIndicator = document.createElement('loading-indicator');
  document.body.appendChild(loadingIndicator);

  try {
    notes = await getAllNotes();
    renderNotes();
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Gagal mengambil catatan. Silakan coba lagi nanti.',
    });
  } finally {
    document.body.removeChild(loadingIndicator);
  }

  document.addEventListener('add-note', async (e) => {
    const { title, body } = e.detail;
    document.body.appendChild(loadingIndicator);

    try {
      const newNote = await addNote(title, body);
      notes.unshift(newNote);
      renderNotes();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Catatan baru telah ditambahkan.',
      });
    } catch (error) {
      console.error('Failed to add note:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal menambahkan catatan. Silakan coba lagi.',
      });
    } finally {
      document.body.removeChild(loadingIndicator);
    }
  });

  document.addEventListener('delete-note', async (e) => {
    document.body.appendChild(loadingIndicator);

    try {
      await deleteNote(e.detail.id);
      notes = notes.filter((note) => note.id !== e.detail.id);
      renderNotes();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Catatan telah dihapus.',
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal menghapus catatan. Silakan coba lagi.',
      });
    } finally {
      document.body.removeChild(loadingIndicator);
    }
  });

  document.addEventListener('archive-note', async (e) => {
    const noteId = e.detail.id;
    const note = notes.find((note) => note.id === noteId);

    if (note) {
      const loadingIndicator = document.createElement('loading-indicator');
      document.body.appendChild(loadingIndicator);

      try {
        if (note.archived) {
          await unarchiveNote(noteId);
        } else {
          await archiveNote(noteId);
        }

        note.archived = !note.archived;
        renderNotes();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `Catatan telah ${
            note.archived ? 'diarsipkan' : 'dipindahkan dari arsip'
          }.`,
        });
      } catch (error) {
        console.error(
          `Failed to ${
            note.archived ? 'unarchive' : 'archive'
          } note with ID: ${noteId}`,
          error
        );
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: `Gagal ${
            note.archived ? 'membatalkan arsip' : 'mengarsipkan'
          } catatan. Silakan coba lagi.`,
        });
      } finally {
        document.body.removeChild(loadingIndicator);
      }
    } else {
      console.error(`Note with ID: ${noteId} not found`);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Catatan tidak ditemukan.',
      });
    }
  });

  document.addEventListener('search-notes', (e) => {
    const searchTerm = e.detail.searchTerm.toLowerCase();
    if (searchTerm) {
      const filteredNotes = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm) ||
          note.body.toLowerCase().includes(searchTerm)
      );
      renderNotes(filteredNotes);
    } else {
      renderNotes();
    }
  });

  window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
});
