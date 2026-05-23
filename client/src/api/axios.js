import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://tayal-project-2.onrender.com/api',
});

export default api;
