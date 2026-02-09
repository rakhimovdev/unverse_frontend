import axios from "axios"

const Api = axios.create({
    baseURL: 'http://localhost:5000/' // Backend server URL
})
//  https://unverse-backend.onrender.com/
// http://localhost:5000/
export default Api
