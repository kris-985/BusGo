export type ID = string
export type ISODateTime = string
export type CurrencyCode = 'BGN' | 'EUR'

export type Money = {
  amount: number
  currency: CurrencyCode
}

