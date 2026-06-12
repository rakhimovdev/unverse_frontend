import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL

export const createClickPayment = async (planType) => {
    const token = localStorage.getItem('token')
    const res = await axios.post(
        `${API_URL}/api/click/create`,
        { planType },
        { headers: { Authorization: `Bearer ${token}` } }
    )
    return res.data
}