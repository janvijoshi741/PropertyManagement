import PDFDocument from 'pdfkit';

interface DocumentData {
  title: string;
  subtitle: string;
  date: string;
  number: string;
  amount: number;
  currency: string;
  propertyAddress: string;
  tenantBranding: {
    name: string;
    logo_url?: string;
    primary_color?: string;
  };
}

export class TemplateService {
  static async generatePDF(data: DocumentData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = data.tenantBranding.primary_color || '#0F172A';

      // Header - Branding
      if (data.tenantBranding.name) {
        doc.fillColor(primaryColor)
           .fontSize(20)
           .text(data.tenantBranding.name, 50, 50);
      }

      doc.fillColor('#64748b')
         .fontSize(10)
         .text('Property Management Portal', 50, 75);

      // Title Section
      doc.fillColor('#1e293b')
         .fontSize(24)
         .text(data.title, 50, 120, { align: 'right' });
      
      doc.fontSize(12)
         .text(`${data.subtitle} #${data.number}`, 50, 150, { align: 'right' });

      // Horizontal Line
      doc.moveTo(50, 180)
         .lineTo(550, 180)
         .strokeColor('#e2e8f0')
         .stroke();

      // Info Grid
      doc.fillColor('#475569')
         .fontSize(10)
         .text('BILLED TO:', 50, 200);
      
      doc.fillColor('#1e293b')
         .fontSize(12)
         .text(data.propertyAddress, 50, 215, { width: 250 });

      doc.fillColor('#475569')
         .fontSize(10)
         .text('DATE:', 400, 200);
      
      doc.fillColor('#1e293b')
         .fontSize(12)
         .text(data.date, 400, 215);

      // Amount Section (Highlighted Box)
      const amountBoxY = 280;
      doc.rect(50, amountBoxY, 500, 60)
         .fill(primaryColor + '10'); // Very light primary color (hex + alpha if supported, or just use gray)
      
      doc.fillColor(primaryColor)
         .fontSize(14)
         .text('TOTAL AMOUNT DUE', 70, amountBoxY + 22);
      
      doc.fontSize(20)
         .text(`${data.currency} ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 400, amountBoxY + 18, { align: 'right', width: 130 });

      // Footer
      doc.fillColor('#94a3b8')
         .fontSize(10)
         .text('Thank you for your business.', 50, 700, { align: 'center', width: 500 });
      
      doc.text('This is a computer-generated document.', 50, 715, { align: 'center', width: 500 });

      doc.end();
    });
  }
}
