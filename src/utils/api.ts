import axios from 'axios'

let API_BASE = '';

if (import.meta.env.DEV) {
  API_BASE = import.meta.env.VITE_BASE_URL_DEV;
} else {
  API_BASE = import.meta.env.VITE_BASE_URL_PROD;
}

const api = axios.create({ baseURL: API_BASE })
export function setAuthToken(token?: string){
     if(token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      else delete api.defaults.headers.common['Authorization'] 
    }
export default api
