'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/input')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          企業情報抽出アプリケーション
        </h1>
        <p className="text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  )
}
