'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { DropzoneArea } from '../../src/components/input/DropzoneArea'
import { extractCompanyInfo, ApiError, InputPayload } from '../../src/lib/api'

interface InputFormData {
  url?: string
  file?: File
}

export default function InputPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, setValue } = useForm<InputFormData>()

  const url = watch('url')


  const onSubmit = async (data: InputFormData) => {
    if (!data.url && !selectedFile) {
      setError('URLまたはPDFファイルを入力してください')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      let payload: InputPayload = {}
      
      if (data.url) {
        payload = { url: data.url }
      } else if (selectedFile) {
        // PDFの場合：デモ用ダミーテキスト
        const plainText = `PDFファイル: ${selectedFile.name}\n\n[デモ用テキスト]\n株式会社サンプル\n設立: 2010年\n業界: IT・ソフトウェア\n従業員数: 50名\n本社: 東京都渋谷区\n事業内容: Webアプリケーション開発`
        payload = { plainText }
      }

      const extractedData = await extractCompanyInfo(payload)
      
      // 結果をlocalStorageに保存
      localStorage.setItem('companyInfo', JSON.stringify(extractedData))
      
      // プレビュー画面へ遷移
      router.push('/preview')
      
    } catch (error) {
      console.error('Error:', error)
      
      if (error instanceof ApiError) {
        setError(`${error.message}${error.details ? ` (${error.details})` : ''}`)
      } else {
        setError('予期しないエラーが発生しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          企業情報抽出
        </h1>
        
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">閉じる</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              企業サイトURL
            </label>
            <input
              {...register('url')}
              type="url"
              id="url"
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="text-center text-gray-500 font-medium">
            または
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDFファイル
            </label>
            <DropzoneArea
              onFileAccepted={(file) => {
                setSelectedFile(file)
                setValue('file', file)
              }}
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                選択されたファイル: {selectedFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (!url && !selectedFile)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '処理中...' : '企業情報を抽出'}
          </button>
        </form>
      </div>
    </div>
  )
}