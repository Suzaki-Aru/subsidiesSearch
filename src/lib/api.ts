export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface InputPayload {
  url?: string
  plainText?: string
}

export interface ExtractedData {
  corporateName: string
  foundingYear?: string
  industry?: string
  description?: string
  employeeScale?: '1-9' | '10-49' | '50-99' | '100-299' | '300+'
  headOffice: string
  offices?: { id: number; address: string }[]
  revenue?: string
  capital?: string
  contactMail?: string
  password?: string
  challenges?: string
  notes?: string
  rawOutput?: string
}

export async function extractCompanyInfo(payload: InputPayload): Promise<ExtractedData> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒タイムアウト

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // サーバーから返ってきたエラーメッセージを取得
      let errorData
      try {
        errorData = await response.json()
      } catch {
        // JSON パースに失敗した場合
        throw new ApiError(
          response.status,
          `サーバーエラー (${response.status})`,
          response.statusText
        )
      }

      throw new ApiError(
        response.status,
        errorData.error || 'サーバーでエラーが発生しました',
        errorData.details || response.statusText
      )
    }

    const data = await response.json()
    return data as ExtractedData

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'リクエストがタイムアウトしました', '60秒以内に処理が完了しませんでした')
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new ApiError(0, 'ネットワークエラー', 'サーバーに接続できません')
      }
    }

    throw new ApiError(500, '予期しないエラーが発生しました', String(error))
  }
}