import axios from 'axios'
import { auth } from './firebase'

const baseURL = import.meta.env.VITE_BACKEND_URL || '/api'

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    }
})

api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser

        if (user) {
            const token = await user.getIdToken()

            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default api