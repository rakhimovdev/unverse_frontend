import axios from "axios"

const Api = axios.create({
    baseURL: 'https://unverse-backend.onrender.com/' // Backend server URL
})
//  https://unverse-backend.onrender.com/
// http://localhost:5000/
export default Api
