const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export async function uploadImage(formData, accessToken) {
  const res = await fetch(`${API_URL}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData, // multipart/form-data, NO poner Content-Type manual
  });
  return handleResponse(res);
}

export async function getMyImages(accessToken) {
  const res = await fetch(`${API_URL}/images/my`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}

export async function getGallery() {
  const res = await fetch(`${API_URL}/images/gallery`);
  return handleResponse(res);
}

export async function updateImage(id, data, accessToken) {
  const res = await fetch(`${API_URL}/images/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteImage(id, accessToken) {
  const res = await fetch(`${API_URL}/images/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}
