import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PaymentSuccess() {
    const navigate = useNavigate()

    useEffect(() => {
        setTimeout(() => navigate('/account'), 3000)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-2">To'lov muvaffaqiyatli!</h1>
            <p className="text-gray-500">Pro akkauntingiz faollashtirildi. 3 soniyada yo'naltirilasiz...</p>
        </div>
    )
}