import { cityIdByName } from '../config/constants.js'

export function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function slug(value) {
  return normalize(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function titleCase(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\p{L}+/gu, (word) => word[0].toLocaleUpperCase() + word.slice(1))
}

export function cityByName(name) {
  return {
    id: cityIdByName.get(name) ?? normalize(name).replace(/\s+/g, '-'),
    name,
    countryCode: 'BG',
  }
}

export function localDatePart(iso) {
  return String(iso ?? '').slice(0, 10)
}

export function isYmd(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))
}
