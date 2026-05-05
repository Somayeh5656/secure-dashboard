import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { fetchWithCsrf } from '../utils/csrf';   // adjust path if needed

export default function App() {
  useEffect(() => {
    // Fetch CSRF token on app load
    fetchWithCsrf('/api/auth/csrf')
      .then(res => res.json())
      .catch(err => console.error('CSRF token fetch failed', err));
  }, []);

  return <RouterProvider router={router} />;
}