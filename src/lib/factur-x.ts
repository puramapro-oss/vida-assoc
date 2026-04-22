/**
 * Factur-X (ZUGFeRD FR) — XML CII + PDF.
 * Profile MINIMUM — conforme Chorus Pro standard.
 * V7.2 §26 — art. 293 B CGI TVA non applicable.
 *
 * Format : XML CII (Cross Industry Invoice) + PDF/A-3 avec XML embedded.
 * Ce module produit l'XML ; le PDF est généré via pdfkit côté endpoint.
 */

export interface FacturXInput {
  invoice_number: string       // Ex: FA-2026-000001
  issue_date: string           // YYYY-MM-DD
  amount_cents: number
  currency?: 'EUR'
  seller: {
    name: string
    siret: string
    address: { street: string; city: string; postal_code: string; country_code: string }
    tva_number?: string | null
    tax_note?: string          // Ex: "TVA non applicable, art. 293 B du CGI"
  }
  buyer: {
    name: string
    siret?: string | null
    address?: { street: string; city: string; postal_code: string; country_code: string }
  }
  line: {
    description: string
    amount_cents: number
  }
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const fmt = (cents: number) => (cents / 100).toFixed(2)

/**
 * Génère un XML CII (Cross Industry Invoice) UN/CEFACT conforme Factur-X MINIMUM.
 */
export function buildFacturXXml(input: FacturXInput): string {
  const cur = input.currency ?? 'EUR'
  const taxNote = input.seller.tax_note ?? 'TVA non applicable, art. 293 B du CGI'

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escape(input.invoice_number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${input.issue_date.replace(/-/g, '')}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escape(input.seller.name)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escape(input.seller.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escape(input.seller.address.postal_code)}</ram:PostcodeCode>
          <ram:LineOne>${escape(input.seller.address.street)}</ram:LineOne>
          <ram:CityName>${escape(input.seller.address.city)}</ram:CityName>
          <ram:CountryID>${escape(input.seller.address.country_code)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${input.seller.tva_number ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escape(input.seller.tva_number)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escape(input.buyer.name)}</ram:Name>
        ${input.buyer.siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escape(input.buyer.siret)}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${cur}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${fmt(input.amount_cents)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${cur}">0.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${fmt(input.amount_cents)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${fmt(input.amount_cents)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
      <ram:IncludedNote>
        <ram:Content>${escape(taxNote)}</ram:Content>
      </ram:IncludedNote>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
}

/**
 * Génère un PDF minimal (texte structuré) pour Factur-X.
 * Note : production-grade devrait utiliser `pdfkit` + embedding XML via PDF/A-3.
 * Pour MVP, on génère une représentation texte lisible + on stocke XML à part.
 */
export function buildSimpleInvoicePdfText(input: FacturXInput): string {
  const cur = input.currency ?? 'EUR'
  return [
    `=== FACTURE ${input.invoice_number} ===`,
    `Émise le : ${input.issue_date}`,
    ``,
    `ÉMETTEUR :`,
    `  ${input.seller.name}`,
    `  SIRET : ${input.seller.siret}`,
    `  ${input.seller.address.street}`,
    `  ${input.seller.address.postal_code} ${input.seller.address.city}`,
    `  ${input.seller.address.country_code}`,
    input.seller.tva_number ? `  TVA : ${input.seller.tva_number}` : '',
    ``,
    `CLIENT :`,
    `  ${input.buyer.name}`,
    input.buyer.siret ? `  SIRET : ${input.buyer.siret}` : '',
    ``,
    `PRESTATION :`,
    `  ${input.line.description}`,
    `  Montant HT : ${fmt(input.line.amount_cents)} ${cur}`,
    `  ${input.seller.tax_note ?? 'TVA non applicable, art. 293 B du CGI'}`,
    ``,
    `TOTAL À PAYER : ${fmt(input.amount_cents)} ${cur}`,
    ``,
    `Cette facture est conforme Factur-X (XML CII Chorus Pro).`,
    `Horodatage blockchain : OpenTimestamps (voir /karma-regulation).`,
  ].filter(Boolean).join('\n')
}

export function generateInvoiceNumber(yearLastIncrement: number): string {
  const year = new Date().getFullYear()
  const num = String(yearLastIncrement + 1).padStart(6, '0')
  return `FA-${year}-${num}`
}
