/**
 * PDF Invoice Generation Service
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  notes?: string;
  appointment: {
    type: string;
    startTime: Date;
    endTime: Date;
    durationHours: number;
    roomType: string;
    roomNumber?: string;
  };
  client: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
  };
}

interface CompanyData {
  name: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phone?: string;
  vat?: string;
}

/**
 * Generate PDF invoice
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData,
  companyData: CompanyData
): Promise<Uint8Array> {
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.153, 0.125, 0.106); // EQB wood primary #27201B
  const secondaryColor = rgb(0.220, 0.176, 0.156); // EQB wood secondary #382D28
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);

  let yPosition = height - 60;

  // Header - Company Info
  page.drawText('EQB', {
    x: 50,
    y: yPosition,
    size: 32,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText('Equilibrium - Wellness & Fitness Coworking', {
    x: 50,
    y: yPosition - 30,
    size: 10,
    font: font,
    color: secondaryColor,
  });

  // Company details
  yPosition -= 60;
  const companyDetails = [
    companyData.name,
    companyData.address,
    `${companyData.zipCode} ${companyData.city}`,
    companyData.email,
    ...(companyData.phone ? [companyData.phone] : []),
    ...(companyData.vat ? [`P.IVA: ${companyData.vat}`] : []),
  ];

  companyDetails.forEach((line) => {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: textColor,
    });
    yPosition -= 14;
  });

  // Invoice Title & Number
  yPosition = height - 60;
  page.drawText('FATTURA', {
    x: width - 250,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: primaryColor,
  });

  yPosition -= 30;
  page.drawText(`N. ${invoiceData.id.substring(0, 8).toUpperCase()}`, {
    x: width - 250,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: textColor,
  });

  yPosition -= 20;
  page.drawText(`Data: ${format(new Date(invoiceData.issueDate), 'dd/MM/yyyy', { locale: it })}`, {
    x: width - 250,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  });

  yPosition -= 16;
  page.drawText(`Scadenza: ${format(new Date(invoiceData.dueDate), 'dd/MM/yyyy', { locale: it })}`, {
    x: width - 250,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  });

  // Client Info Section
  yPosition = height - 240;
  page.drawRectangle({
    x: 50,
    y: yPosition - 80,
    width: width - 100,
    height: 100,
    color: lightGray,
  });

  page.drawText('INTESTATO A:', {
    x: 60,
    y: yPosition - 10,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  const clientDetails = [
    invoiceData.client.name,
    ...(invoiceData.client.companyName ? [invoiceData.client.companyName] : []),
    ...(invoiceData.client.address ? [invoiceData.client.address] : []),
    ...(invoiceData.client.city && invoiceData.client.zipCode
      ? [`${invoiceData.client.zipCode} ${invoiceData.client.city}`]
      : []),
    invoiceData.client.email,
    ...(invoiceData.client.phone ? [invoiceData.client.phone] : []),
  ];

  yPosition -= 26;
  clientDetails.forEach((line) => {
    page.drawText(line, {
      x: 60,
      y: yPosition,
      size: 9,
      font: font,
      color: textColor,
    });
    yPosition -= 14;
  });

  // Service Details Table
  yPosition -= 40;

  // Table Header
  page.drawRectangle({
    x: 50,
    y: yPosition - 25,
    width: width - 100,
    height: 25,
    color: secondaryColor,
  });

  page.drawText('DESCRIZIONE', {
    x: 60,
    y: yPosition - 17,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('QUANTITÀ', {
    x: width - 280,
    y: yPosition - 17,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('PREZZO', {
    x: width - 180,
    y: yPosition - 17,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('TOTALE', {
    x: width - 110,
    y: yPosition - 17,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Table Row
  yPosition -= 40;
  const serviceDescription = `${invoiceData.appointment.type} - ${format(
    new Date(invoiceData.appointment.startTime),
    'dd/MM/yyyy HH:mm',
    { locale: it }
  )}`;
  
  page.drawText(serviceDescription, {
    x: 60,
    y: yPosition,
    size: 9,
    font: font,
    color: textColor,
    maxWidth: 250,
  });

  page.drawText(`${invoiceData.appointment.durationHours}h`, {
    x: width - 270,
    y: yPosition,
    size: 9,
    font: font,
    color: textColor,
  });

  const pricePerHour = invoiceData.amount / invoiceData.appointment.durationHours;
  page.drawText(`€ ${pricePerHour.toFixed(2)}`, {
    x: width - 180,
    y: yPosition,
    size: 9,
    font: font,
    color: textColor,
  });

  page.drawText(`€ ${invoiceData.amount.toFixed(2)}`, {
    x: width - 120,
    y: yPosition,
    size: 9,
    font: fontBold,
    color: textColor,
  });

  // Line separator
  yPosition -= 30;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: lightGray,
  });

  // Totals
  yPosition -= 30;

  // Subtotal
  page.drawText('Subtotale:', {
    x: width - 220,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  });

  page.drawText(`€ ${invoiceData.amount.toFixed(2)}`, {
    x: width - 120,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  });

  yPosition -= 20;

  // IVA (assuming esente for professionals)
  page.drawText('IVA (esente art. 10):', {
    x: width - 220,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  });

  page.drawText('€ 0.00', {
    x: width - 120,
    y: yPosition,
    size: 10,
    font: font,
    color: textColor,
  });

  yPosition -= 30;

  // Total
  page.drawRectangle({
    x: width - 240,
    y: yPosition - 20,
    width: 190,
    height: 30,
    color: primaryColor,
  });

  page.drawText('TOTALE:', {
    x: width - 230,
    y: yPosition - 10,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`€ ${invoiceData.amount.toFixed(2)}`, {
    x: width - 120,
    y: yPosition - 10,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Notes
  if (invoiceData.notes) {
    yPosition -= 60;
    page.drawText('NOTE:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: primaryColor,
    });

    yPosition -= 18;
    page.drawText(invoiceData.notes, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: textColor,
      maxWidth: width - 100,
    });
  }

  // Footer
  const footerY = 60;
  page.drawText('Documento generato dalla piattaforma EQB', {
    x: 50,
    y: footerY,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Generato il ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`, {
    x: width - 200,
    y: footerY,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serialize PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
