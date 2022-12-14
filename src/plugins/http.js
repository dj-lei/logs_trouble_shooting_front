import axios from 'axios'

axios.defaults.withCredentials = true

export const service = axios.create({
    baseURL: process.env.BASE_URL,
    timeout: 60000
})

export default service
