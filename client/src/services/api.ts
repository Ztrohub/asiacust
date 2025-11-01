import axios from 'axios'

const baseURL = import.meta.env.VITE_BACKEND_URL || '/api'

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    }
})

export default api