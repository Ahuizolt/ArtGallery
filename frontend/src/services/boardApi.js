const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export async function getMyBoards(accessToken) {
  const res = await fetch(`${API_URL}/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}

export async function createBoard(name, accessToken) {
  const res = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function saveImageToBoard(boardId, imageId, accessToken) {
  const res = await fetch(`${API_URL}/boards/${boardId}/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ image_id: imageId }),
  });
  return handleResponse(res);
}

export async function getBoardImages(boardId, accessToken) {
  const res = await fetch(`${API_URL}/boards/${boardId}/images`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}

export async function deleteBoard(boardId, accessToken) {
  const res = await fetch(`${API_URL}/boards/${boardId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}
