'use client'
import { useForm } from 'react-hook-form'
import { useEffect, useRef, useState } from 'react'
import { CompanyInfo, Office } from '../types/company'

// 売上高の選択肢
const REVENUE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: '1000万円未満', label: '1000万円未満' },
  { value: '1000万円〜5000万円', label: '1000万円〜5000万円' },
  { value: '5000万円〜1億円', label: '5000万円〜1億円' },
  { value: '1億円〜5億円', label: '1億円〜5億円' },
  { value: '5億円〜10億円', label: '5億円〜10億円' },
  { value: '10億円〜50億円', label: '10億円〜50億円' },
  { value: '50億円〜100億円', label: '50億円〜100億円' },
  { value: '100億円以上', label: '100億円以上' }
]

// 資本金の選択肢
const CAPITAL_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: '100万円未満', label: '100万円未満' },
  { value: '100万円〜300万円', label: '100万円〜300万円' },
  { value: '300万円〜500万円', label: '300万円〜500万円' },
  { value: '500万円〜1000万円', label: '500万円〜1000万円' },
  { value: '1000万円〜3000万円', label: '1000万円〜3000万円' },
  { value: '3000万円〜5000万円', label: '3000万円〜5000万円' },
  { value: '5000万円〜1億円', label: '5000万円〜1億円' },
  { value: '1億円以上', label: '1億円以上' }
]

interface CompanyFormProps {
  data: CompanyInfo
  onChange: (data: CompanyInfo) => void
  onComplete?: () => void
}

// 数値文字列から適切な選択肢を自動選択する関数
const getRevenueOption = (revenue: string | undefined): string => {
  if (!revenue) return ''
  const numStr = revenue.replace(/[^0-9]/g, '')
  const num = parseInt(numStr)
  if (isNaN(num)) return ''
  
  if (num < 1000) return '1000万円未満'
  if (num < 5000) return '1000万円〜5000万円'
  if (num < 10000) return '5000万円〜1億円'
  if (num < 50000) return '1億円〜5億円'
  if (num < 100000) return '5億円〜10億円'
  if (num < 500000) return '10億円〜50億円'
  if (num < 1000000) return '50億円〜100億円'
  return '100億円以上'
}

const getCapitalOption = (capital: string | undefined): string => {
  if (!capital) return ''
  const numStr = capital.replace(/[^0-9]/g, '')
  const num = parseInt(numStr)
  if (isNaN(num)) return ''
  
  if (num < 100) return '100万円未満'
  if (num < 300) return '100万円〜300万円'
  if (num < 500) return '300万円〜500万円'
  if (num < 1000) return '500万円〜1000万円'
  if (num < 3000) return '1000万円〜3000万円'
  if (num < 5000) return '3000万円〜5000万円'
  if (num < 10000) return '5000万円〜1億円'
  return '1億円以上'
}

export function CompanyForm({ data, onChange, onComplete }: CompanyFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<CompanyInfo>({
    defaultValues: data
  })

  const watchedData = watch()
  const previousDataRef = useRef<string>('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // 初期データに基づいて選択肢を自動設定
  useEffect(() => {
    if (data.revenue && !watchedData.revenue) {
      const revenueOption = getRevenueOption(data.revenue)
      if (revenueOption) setValue('revenue', revenueOption)
    }
    if (data.capital && !watchedData.capital) {
      const capitalOption = getCapitalOption(data.capital)
      if (capitalOption) setValue('capital', capitalOption)
    }
  }, [data.revenue, data.capital, setValue, watchedData.revenue, watchedData.capital])

  useEffect(() => {
    const currentDataString = JSON.stringify(watchedData)
    if (currentDataString !== previousDataRef.current) {
      previousDataRef.current = currentDataString
      onChange(watchedData)
    }
  }, [watchedData, onChange])

  const addOffice = () => {
    const currentOffices = watchedData.offices || []
    if (currentOffices.length < 5) {
      const newOffice: Office = {
        id: Date.now(),
        address: ''
      }
      setValue('offices', [...currentOffices, newOffice])
    }
  }

  const removeOffice = (id: number) => {
    const currentOffices = watchedData.offices || []
    setValue('offices', currentOffices.filter(office => office.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* LLM原文出力表示 */}
      {data.rawOutput && (
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">AI分析結果</h3>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById('llm-output')
                if (element) {
                  element.style.display = element.style.display === 'none' ? 'block' : 'none'
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              原文表示/非表示
            </button>
          </div>
          
          {/* ユーザーフレンドリーな抽出データ表示 */}
          <div className="bg-white p-4 border border-gray-100 rounded mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-gray-700">企業名:</span> <span className="text-gray-900">{data.corporateName || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">設立年:</span> <span className="text-gray-900">{data.foundingYear || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">業界:</span> <span className="text-gray-900">{data.industry || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">従業員規模:</span> <span className="text-gray-900">{data.employeeScale || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">本社:</span> <span className="text-gray-900">{data.headOffice || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">売上高:</span> <span className="text-gray-900">{data.revenue || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">資本金:</span> <span className="text-gray-900">{data.capital || '未取得'}</span></div>
              <div><span className="font-medium text-gray-700">問い合わせ:</span> <span className="text-gray-900">{data.contactMail || '未取得'}</span></div>
            </div>
            {data.description && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div><span className="font-medium text-gray-700">事業内容:</span> <span className="text-gray-900">{data.description}</span></div>
              </div>
            )}
            {data.challenges && (
              <div className="mt-2">
                <div><span className="font-medium text-gray-700">注力分野:</span> <span className="text-gray-900">{data.challenges}</span></div>
              </div>
            )}
            {data.notes && (
              <div className="mt-2">
                <div><span className="font-medium text-gray-700">備考:</span> <span className="text-gray-900">{data.notes}</span></div>
              </div>
            )}
            {data.offices && data.offices.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="font-medium text-gray-700 mb-2">支社・営業所:</div>
                {data.offices.map((office, index) => (
                  <div key={office.id} className="ml-4 text-gray-900">• {office.address}</div>
                ))}
              </div>
            )}
          </div>
          
          <div id="llm-output" className="bg-white p-4 border border-gray-100 rounded text-sm" style={{display: 'none'}}>
            <pre className="whitespace-pre-wrap text-black font-mono leading-relaxed">
              {data.rawOutput}
            </pre>
          </div>
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-6 text-gray-900">企業情報の確認・編集</h2>
      
      <form className="space-y-0">
        {/* 企業基本情報セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">企業基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('corporateName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.corporateName ? "記入をお願いします" : "株式会社サンプル"}
                style={{
                  backgroundColor: !watchedData.corporateName ? '#fef3f3' : 'white',
                  borderColor: !watchedData.corporateName ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                設立年
              </label>
              <input
                {...register('foundingYear')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.foundingYear ? "記入をお願いします" : "2010年"}
                style={{
                  backgroundColor: !watchedData.foundingYear ? '#fef3f3' : 'white',
                  borderColor: !watchedData.foundingYear ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業界
              </label>
              <input
                {...register('industry')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.industry ? "記入をお願いします" : "IT・ソフトウェア"}
                style={{
                  backgroundColor: !watchedData.industry ? '#fef3f3' : 'white',
                  borderColor: !watchedData.industry ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                従業員規模
              </label>
              <select
                {...register('employeeScale')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ color: '#000000' }}
              >
                <option value="">選択してください</option>
                <option value="1-9">1-9名</option>
                <option value="10-49">10-49名</option>
                <option value="50-99">50-99名</option>
                <option value="100-299">100-299名</option>
                <option value="300+">300名以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                売上高
              </label>
              <select
                {...register('revenue')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: !watchedData.revenue ? '#fef3f3' : 'white',
                  borderColor: !watchedData.revenue ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              >
                {REVENUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                資本金
              </label>
              <select
                {...register('capital')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: !watchedData.capital ? '#fef3f3' : 'white',
                  borderColor: !watchedData.capital ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              >
                {CAPITAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 企業詳細情報セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">企業詳細情報</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                本社所在地 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('headOffice')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.headOffice ? "記入をお願いします" : "東京都渋谷区"}
                style={{
                  backgroundColor: !watchedData.headOffice ? '#fef3f3' : 'white',
                  borderColor: !watchedData.headOffice ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                事業内容
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.description ? "記入をお願いします" : "Webアプリケーション開発、システム構築..."}
                style={{
                  backgroundColor: !watchedData.description ? '#fef3f3' : 'white',
                  borderColor: !watchedData.description ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>
          </div>
        </div>

        {/* 拠点情報セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">拠点情報</h3>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                支社・営業所 (最大5つ)
              </label>
              <button
                type="button"
                onClick={addOffice}
                disabled={(watchedData.offices?.length || 0) >= 5}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
            {watchedData.offices?.map((office, index) => (
              <div key={office.id} className="flex gap-2 mb-2">
                <input
                  {...register(`offices.${index}.address`)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="支社の住所"
                  style={{ color: '#000000' }}
                />
                <button
                  type="button"
                  onClick={() => removeOffice(office.id)}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 課題・備考セクション */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">課題・備考</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                課題
              </label>
              <textarea
                {...register('challenges')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.challenges ? "記入をお願いします" : "現在の課題について記載してください..."}
                style={{
                  backgroundColor: !watchedData.challenges ? '#fef3f3' : 'white',
                  borderColor: !watchedData.challenges ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備考
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={!watchedData.notes ? "記入をお願いします" : "その他の情報があれば記載してください..."}
                style={{
                  backgroundColor: !watchedData.notes ? '#fef3f3' : 'white',
                  borderColor: !watchedData.notes ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
            </div>
          </div>
        </div>

        {/* 補助金提案サービス説明 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">定期的な補助金提案サービス</h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                入力いただいた企業情報をもとに、御社に最適な補助金・助成金情報を定期的にお知らせいたします。
                新しい制度や締切情報なども含め、最新の情報を定期的にメールでお届けします。
              </p>
              <div className="text-xs text-blue-700">
                ※ サービスを利用するには下記の担当者情報の登録が必要です
              </div>
            </div>
          </div>
        </div>

        {/* 担当者登録セクション */}
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-300">担当者情報登録</h3>
          <p className="text-sm text-gray-600 mb-6">
            補助金情報の配信および管理画面へのログインに使用します
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                {...register('contactMail')}
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="例: tanaka@company.co.jp"
                style={{
                  backgroundColor: !watchedData.contactMail ? '#fef3f3' : 'white',
                  borderColor: !watchedData.contactMail ? '#f87171' : '#d1d5db',
                  color: '#000000'
                }}
              />
              <p className="text-xs text-gray-500 mt-1">補助金情報の配信先として使用されます</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="8文字以上の英数字"
                style={{ color: '#000000' }}
              />
              <p className="text-xs text-gray-500 mt-1">管理画面へのログインに使用されます</p>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                <span className="text-red-500">*</span> 
                <a href="#" className="text-blue-600 hover:underline">利用規約</a>および
                <a href="#" className="text-blue-600 hover:underline">プライバシーポリシー</a>に同意する
              </label>
            </div>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={!termsAccepted}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  termsAccepted
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (termsAccepted && onComplete) {
                    onComplete()
                  }
                }}
              >
                {termsAccepted ? '登録完了' : '利用規約に同意してください'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}