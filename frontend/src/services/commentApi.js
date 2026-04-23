const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export async function getComments(imageId) {
  const res = await fetch(`${API_URL}/images/${imageId}/comments`);
  return handleResponse(res);
}

export async function addComment(imageId, text, accessToken) {
  const res = await fetch(`${API_URL}/images/${imageId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

export async function deleteComment(imageId, commentId, accessToken) {
  const res = await fetch(`${API_URL}/images/${imageId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}
