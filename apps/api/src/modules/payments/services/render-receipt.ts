import PdfPrinter from 'pdfmake';
import type Stripe from 'stripe';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const money = (cents: number, ccy?: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (ccy || 'USD').toUpperCase(),
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);

export async function renderReceiptPdf(session: Stripe.Checkout.Session): Promise<Buffer> {
  const printer = new PdfPrinter(fonts as any);

  const paid = session.amount_total ?? 0;
  const currency = session.currency ?? 'usd';
  const whenISO = session.created
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString();

  const itemId = session.metadata?.itemId ?? '—';
  const title = session.custom_text?.submit?.message || 'Containo Logistics';

  const docDefinition: any = {
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: title, bold: true, margin: [0, 0, 0, 2] },
      { text: 'PAYMENT RECEIPT', style: 'h1' },

      {
        columns: [
          [
            { text: `Receipt #: ${session.id}`, margin: [0, 6, 0, 0] },
            { text: `Created: ${whenISO.replace('T', ' ').slice(0, 16)} UTC` },
          ],
          [
            {
              text: `Currency: ${currency.toUpperCase()}`,
              alignment: 'right',
              margin: [0, 6, 0, 0],
            },
            { text: `Amount: ${money(paid, currency)}`, alignment: 'right' },
          ],
        ],
      },

      { text: 'Details', style: 'h2', margin: [0, 10, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 160],
          body: [
            [
              { text: 'Field', style: 'th' },
              { text: 'Value', style: 'th' },
            ],
            [
              { text: 'Item ID', style: 'td' },
              { text: itemId, style: 'td' },
            ],
            [
              { text: 'Mode', style: 'td' },
              { text: session.metadata?.mode ?? '—', style: 'td' },
            ],
            [
              { text: 'Route', style: 'td' },
              {
                text: `${session.metadata?.originPort ?? '—'} → ${session.metadata?.destPort ?? '—'}`,
                style: 'td',
              },
            ],
            [
              { text: 'Cut-off', style: 'td' },
              { text: session.metadata?.cutoffAt ?? '—', style: 'td' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },

      { text: `Total paid: ${money(paid, currency)}`, style: 'total', margin: [0, 12, 0, 0] },
      { text: 'Thank you for your business.', margin: [0, 8, 0, 0] },
    ],
    styles: {
      h1: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
      h2: { bold: true, margin: [0, 8, 0, 2] },
      th: { bold: true, fillColor: '#f3f4f6', margin: [0, 4, 0, 4] },
      td: { margin: [0, 2, 0, 2] },
      total: { bold: true },
    },
  };

  const pdf = printer.createPdfKitDocument(docDefinition);
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    pdf.on('data', (d: Buffer) => chunks.push(d));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
    pdf.end();
  });
}
