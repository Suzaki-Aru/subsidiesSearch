export type Office = { id: number; address: string }
export interface CompanyInfo {
  corporateName: string
  foundingYear?: string
  industry?: string
  description?: string
  employeeScale?: '1-9' | '10-49' | '50-99' | '100-299' | '300+'
  headOffice: string
  offices?: Office[]           // MAX 5
  revenue?: string
  capital?: string
  contactMail?: string
  password?: string
  challenges?: string
  notes?: string
  rawOutput?: string          // LLM原文出力
}