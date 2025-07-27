'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompanyInfo } from '../../src/types/company'
import { CompanyForm } from '../../src/components/fields/CompanyForm'

export default function PreviewPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedData = localStorage.getItem('companyInfo')
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setCompany(parsedData)
      } catch (error) {
        console.error('Error parsing stored data:', error)
        router.push('/input')
      }
    } else {
      router.push('/input')
    }
    setIsLoading(false)
  }, [])

  const handleComplete = () => {
    if (company) {
      // 実際のアプリケーションでは、ここでデータをサーバーに保存
      console.log('企業情報:', company)
      alert('企業情報が正常に保存されました！')
      
      // デモ用：入力画面に戻る
      localStorage.removeItem('companyInfo')
      router.push('/input')
    }
  }

  const handleBack = () => {
    router.push('/input')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">データが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← 戻る
          </button>
        </div>
        
        <CompanyForm data={company} onChange={setCompany} onComplete={handleComplete} />
      </div>
    </div>
  )
}