import { describe, it, expect } from 'vitest'
import { extractExports } from '../../utils/extract-exports'

describe('extractExports', () => {
  it('extracts named const exports', () => {
    const content = `export const GET = async (req) => {}`
    expect(extractExports(content)).toContain('GET')
  })

  it('extracts named function exports', () => {
    const content = `export function POST() {}`
    expect(extractExports(content)).toContain('POST')
  })

  it('extracts async function exports', () => {
    const content = `export async function DELETE() {}`
    expect(extractExports(content)).toContain('DELETE')
  })

  it('extracts default export', () => {
    const content = `export default function Page() {}`
    expect(extractExports(content)).toContain('default')
  })

  it('extracts multiple exports from a file', () => {
    const content = `
export const GET = async () => {}
export async function POST() {}
export default function Page() {}
    `.trim()
    const result = extractExports(content)
    expect(result).toContain('GET')
    expect(result).toContain('POST')
    expect(result).toContain('default')
  })

  it('returns empty array for file with no exports', () => {
    const content = `const helper = () => {}`
    expect(extractExports(content)).toEqual([])
  })
})
