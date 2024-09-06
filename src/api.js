const BASE_URL = 'https://notes-api.dicoding.dev/v2';

async function getAllNotes() {
  const response = await fetch(`${BASE_URL}/notes`);
  const responseJson = await response.json();
  return responseJson.data;
}

async function addNote(title, body) {
  const response = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body }),
  });
  const responseJson = await response.json();
  return responseJson.data;
}

async function deleteNote(id) {
  await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'DELETE',
  });
}

async function archiveNote(id) {
  const response = await fetch(`${BASE_URL}/notes/${id}/archive`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to archive note with ID: ${id}`);
  }

  const responseJson = await response.json();
  return responseJson.data;
}

async function unarchiveNote(id) {
  const response = await fetch(`${BASE_URL}/notes/${id}/unarchive`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to unarchive note with ID: ${id}`);
  }

  const responseJson = await response.json();
  return responseJson.data;
}

export { getAllNotes, addNote, deleteNote, archiveNote, unarchiveNote };
