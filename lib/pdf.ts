import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { Reception, Chantier } from '@/types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; isPng: boolean } {
  const [header, base64] = dataUrl.split(',');
  const isPng = header.includes('image/png');
  const binary = Buffer.from(base64, 'base64');
  return { bytes: new Uint8Array(binary), isPng };
}

export async function generateReceptionPdf(reception: Reception, chantier: Chantier): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawText = (text: string, size: number, options: { bold?: boolean; color?: [number, number, number] } = {}) => {
    page.drawText(text, {
      x: MARGIN,
      y,
      size,
      font: options.bold ? fontBold : font,
      color: options.color ? rgb(...options.color) : rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 70, width: PAGE_WIDTH, height: 70, color: rgb(0.96, 0.62, 0.04) });
  page.drawText('JMGA', { x: MARGIN, y: PAGE_HEIGHT - 45, size: 24, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Fiche de réception de chantier', { x: MARGIN, y: PAGE_HEIGHT - 62, size: 11, font, color: rgb(1, 1, 1) });
  y = PAGE_HEIGHT - 100;

  drawText(chantier.nom, 16, { bold: true });
  drawText(chantier.adresse, 11);
  drawText(`Client : ${chantier.client_nom}`, 11);
  y -= 4;

  drawText(`Date de réception : ${new Date(reception.date).toLocaleDateString('fr-FR')}`, 11, { bold: true });
  drawText(`Poseur : ${reception.poseur_nom}`, 11);
  drawText(`Client présent : ${reception.client_nom}`, 11);

  if (chantier.puissance_kwc) {
    y -= 4;
    drawText(`Puissance installée : ${chantier.puissance_kwc} kWc`, 11);
    if (chantier.nb_panneaux) drawText(`Panneaux : ${chantier.nb_panneaux} x ${chantier.puissance_panneau_wc || '?'} Wc`, 11);
    if (chantier.nb_onduleurs) drawText(`Onduleurs : ${chantier.nb_onduleurs} x ${chantier.puissance_onduleur_kw || '?'} kW`, 11);
  }

  if (reception.commentaires) {
    y -= 8;
    ensureSpace(30);
    drawText('Commentaires :', 11, { bold: true });
    const lines = wrapText(reception.commentaires, font, 10, PAGE_WIDTH - MARGIN * 2);
    for (const line of lines) {
      ensureSpace(16);
      drawText(line, 10);
    }
  }

  y -= 20;
  ensureSpace(180);

  const boxWidth = (PAGE_WIDTH - MARGIN * 2 - 20) / 2;
  const boxHeight = 130;
  const boxY = y - boxHeight;

  drawText('', 1);
  page.drawText('Signature du poseur', { x: MARGIN, y: y, size: 11, font: fontBold });
  page.drawText('Signature du client', { x: MARGIN + boxWidth + 20, y: y, size: 11, font: fontBold });
  page.drawRectangle({ x: MARGIN, y: boxY, width: boxWidth, height: boxHeight - 20, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page.drawRectangle({ x: MARGIN + boxWidth + 20, y: boxY, width: boxWidth, height: boxHeight - 20, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });

  await embedSignature(doc, page, reception.poseur_signature, MARGIN, boxY, boxWidth, boxHeight - 20);
  await embedSignature(doc, page, reception.client_signature, MARGIN + boxWidth + 20, boxY, boxWidth, boxHeight - 20);

  y = boxY - 30;

  if (reception.photos.length > 0) {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    page.drawText('Photos', { x: MARGIN, y, size: 16, font: fontBold });
    y -= 30;

    const photoWidth = (PAGE_WIDTH - MARGIN * 2 - 20) / 2;
    const photoHeight = 160;
    let col = 0;

    for (const photo of reception.photos) {
      if (y - photoHeight < MARGIN) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
        col = 0;
      }
      const x = MARGIN + col * (photoWidth + 20);
      try {
        const { bytes, isPng } = dataUrlToBytes(photo.data);
        const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const scale = Math.min(photoWidth / image.width, photoHeight / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        page.drawImage(image, { x, y: y - h, width: w, height: h });
        if (photo.legende) {
          page.drawText(photo.legende, { x, y: y - h - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
        }
      } catch {
        // skip unreadable image
      }
      if (col === 1) {
        y -= photoHeight + 26;
        col = 0;
      } else {
        col = 1;
      }
    }
  }

  return doc.save();
}

async function embedSignature(doc: PDFDocument, page: PDFPage, dataUrl: string, x: number, y: number, maxWidth: number, maxHeight: number) {
  if (!dataUrl) return;
  try {
    const { bytes, isPng } = dataUrlToBytes(dataUrl);
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const scale = Math.min((maxWidth - 10) / image.width, (maxHeight - 10) / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, { x: x + (maxWidth - w) / 2, y: y + (maxHeight - h) / 2, width: w, height: h });
  } catch {
    // skip unreadable signature
  }
}
