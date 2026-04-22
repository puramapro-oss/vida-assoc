import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { buildFacturXXml, buildSimpleInvoicePdfText, generateInvoiceNumber } from '@/lib/factur-x'
import { COMPANY_INFO } from '@/lib/constants'

export const runtime = 'nodejs'

const Body = z.object({
  amount_cents: z.number().int().min(100).max(10000000),
  description: z.string().min(3).max(500),
})

export async function POST(req: Request) {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('full_name, city, country')
    .eq('id', user.id)
    .maybeSingle()

  const { data: fiscal } = await service
    .from('fiscal_profiles')
    .select('siret, profile_type, cumul_annual_cents')
    .eq('user_id', user.id)
    .maybeSingle()

  // Compteur annuel pour numéroter
  const year = new Date().getFullYear()
  const { count } = await service
    .from('factur_x_invoices')
    .select('id', { count: 'exact', head: true })
    .gte('issued_at', `${year}-01-01`)
  const invoiceNumber = generateInvoiceNumber(count ?? 0)

  const input = {
    invoice_number: invoiceNumber,
    issue_date: new Date().toISOString().slice(0, 10),
    amount_cents: parsed.data.amount_cents,
    currency: 'EUR' as const,
    seller: {
      name: COMPANY_INFO.name,
      siret: process.env.SASU_SIRET ?? '98300000000000',
      address: {
        street: COMPANY_INFO.address.split(',')[0],
        city: COMPANY_INFO.address.split(',')[1]?.trim().split(' ').slice(1).join(' ') ?? 'Frasne',
        postal_code: COMPANY_INFO.address.split(',')[1]?.trim().split(' ')[0] ?? '25560',
        country_code: 'FR',
      },
      tva_number: null,
      tax_note: COMPANY_INFO.taxNote,
    },
    buyer: {
      name: profile?.full_name ?? user.email ?? 'Utilisateur Sangha',
      siret: fiscal?.siret ?? null,
    },
    line: {
      description: parsed.data.description,
      amount_cents: parsed.data.amount_cents,
    },
  }

  const xml = buildFacturXXml(input)
  const pdfText = buildSimpleInvoicePdfText(input)

  // Upload XML + PDF text (placeholder PDF) to factur-x-invoices bucket
  const xmlBlob = new Blob([xml], { type: 'application/xml' })
  const pdfBlob = new Blob([pdfText], { type: 'application/pdf' })
  const xmlName = `${user.id}/${invoiceNumber}.xml`
  const pdfName = `${user.id}/${invoiceNumber}.pdf`

  const [xmlUp, pdfUp] = await Promise.all([
    service.storage.from('factur-x-invoices').upload(xmlName, xmlBlob, { upsert: true, contentType: 'application/xml' }),
    service.storage.from('factur-x-invoices').upload(pdfName, pdfBlob, { upsert: true, contentType: 'application/pdf' }),
  ])

  if (xmlUp.error || pdfUp.error) {
    return NextResponse.json({ error: xmlUp.error?.message ?? pdfUp.error?.message }, { status: 500 })
  }

  const { data: xmlUrl } = service.storage.from('factur-x-invoices').getPublicUrl(xmlName)
  const { data: pdfUrl } = service.storage.from('factur-x-invoices').getPublicUrl(pdfName)

  const { data: row, error } = await service.from('factur_x_invoices').insert({
    user_id: user.id,
    invoice_number: invoiceNumber,
    amount_cents: parsed.data.amount_cents,
    pdf_url: pdfUrl?.publicUrl ?? null,
    xml_url: xmlUrl?.publicUrl ?? null,
    status: 'issued',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, invoice: row, xml_url: xmlUrl?.publicUrl, pdf_url: pdfUrl?.publicUrl })
}

export async function GET() {
  const sb = await createServerSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('factur_x_invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })
    .limit(30)
  return NextResponse.json({ invoices: data ?? [] })
}
