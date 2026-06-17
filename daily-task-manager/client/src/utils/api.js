export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // If unauthorized, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Only redirect if not already on the login page to prevent redirect loops
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}
