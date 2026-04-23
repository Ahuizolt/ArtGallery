const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export async function searchGallery(q, tags) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (tags && tags.length > 0) params.set('tags', tags.join(','));
  const res = await fetch(`${API_URL}/tags/search?${params}`);
  return handleResponse(res);
}

export async function getAllTags() {
  const res = await fetch(`${API_URL}/tags`);
  return handleResponse(res);
}

export async function getImageTags(imageId) {
  const res = await fetch(`${API_URL}/tags/image/${imageId}`);
  return handleResponse(res);
}

export async function setImageTags(imageId, tags, accessToken) {
  const res = await fetch(`${API_URL}/tags/image/${imageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ tags }),
  });
  return handleResponse(res);
}
