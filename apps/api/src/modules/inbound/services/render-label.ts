import PdfPrinter from 'pdfmake';
import QRCode from 'qrcode';
import type { HubConfig } from '../hub-config.js';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

export type InboundLabelInput = {
  hubCode: string;
  sellerName?: string | null;
  extTracking?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  weightKg?: number | string | null;
};

export async function renderInboundLabelPdf(
  inbound: InboundLabelInput,
  hub: HubConfig
): Promise<Buffer> {
  const printer = new PdfPrinter(fonts as any);

  const toParts = [hub.name, hub.address1];
  if (hub.address2) toParts.push(hub.address2);
  toParts.push([hub.postcode, hub.city].filter(Boolean).join(' '));
  if (hub.country) toParts.push(hub.country);

  const qrPayload = [
    `HUB:${inbound.hubCode}`,
    hub.name ? `TO:${hub.name}` : '',
    inbound.extTracking ? `TRK:${inbound.extTracking}` : '',
    inbound.sellerName ? `SELLER:${inbound.sellerName}` : '',
  ]
    .filter(Boolean)
    .join(';');

  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 0, width: 240 });

  const dims =
    inbound.lengthCm && inbound.widthCm && inbound.heightCm
      ? `${inbound.lengthCm}×${inbound.widthCm}×${inbound.heightCm} cm`
      : null;

  const weight =
    inbound.weightKg != null && inbound.weightKg !== ''
      ? `${Number(inbound.weightKg).toFixed(1)} kg`
      : null;

  const docDefinition: any = {
    defaultStyle: { font: 'Helvetica' },
    pageSize: 'A6',
    pageMargins: [16, 16, 16, 16],
    content: [
      {
        columns: [
          { text: 'CONTAINO', style: 'brand' },
          { text: 'Inbound Label', alignment: 'right', style: 'meta' },
        ],
        margin: [0, 0, 0, 6],
      },

      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'HUB CODE', style: 'label' },
              {
                text: inbound.hubCode.toUpperCase(),
                style: 'hubCode',
                margin: [0, 2, 0, 4],
              },
              inbound.extTracking
                ? { text: `Ext. Tracking: ${inbound.extTracking}`, style: 'small' }
                : undefined,
              inbound.sellerName
                ? { text: `Seller: ${inbound.sellerName}`, style: 'small' }
                : undefined,
              dims || weight
                ? {
                    text: [dims ? `Dims: ${dims}` : '', weight ? `  •  Weight: ${weight}` : '']
                      .join('')
                      .trim(),
                    style: 'small',
                    margin: [0, 2, 0, 0],
                  }
                : undefined,
            ].filter(Boolean),
          },
          {
            width: 120,
            image: qrDataUrl,
            fit: [120, 120],
            alignment: 'right',
          },
        ],
      },

      {
        margin: [0, 8, 0, 0],
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: 'Ship To (Hub)', style: 'label' },
                  ...toParts.map((t) => ({ text: t })),
                  hub.contact
                    ? { text: `Contact: ${hub.contact}`, style: 'smallMuted' }
                    : undefined,
                  hub.phone ? { text: `Phone: ${hub.phone}`, style: 'smallMuted' } : undefined,
                  hub.email ? { text: `Email: ${hub.email}`, style: 'smallMuted' } : undefined,
                ].filter(Boolean),
              },
            ],
          ],
        },
        layout: {
          fillColor: () => '#f8fafc',
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
        },
      },
      {
        margin: [0, 8, 0, 0],
        stack: [
          { text: 'Instructions', style: 'label' },
          {
            text: 'Put the HUB CODE on the outer label and one copy inside the box. Include your tracking number. Fragile? Mark clearly.',
            style: 'small',
          },
        ],
      },
    ],
    styles: {
      brand: { bold: true, fontSize: 12, letterSpacing: 0.5 },
      meta: { fontSize: 10, color: '#475569' },
      label: { fontSize: 9, color: '#64748b', bold: true },
      hubCode: { fontSize: 22, bold: true, characterSpacing: 1 },
      small: { fontSize: 9 },
      smallMuted: { fontSize: 8, color: '#6b7280' },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (d: Buffer) => chunks.push(d));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
