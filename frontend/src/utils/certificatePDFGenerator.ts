import jsPDF from 'jspdf';

export interface AchievementCertificateData {
    studentName: string;
    achievementTitle: string;
    category: string;
    description: string;
    achievementDate: string;
    tokenId: string;
    issuerName?: string;
}

export interface CustomCertificateData {
    studentName: string;
    templateName: string;
    customFields: { name: string; value: string }[];
    tokenId: string;
    issuerName?: string;
}

export const generateAchievementCertificatePDF = (data: AchievementCertificateData): Blob => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background gradient effect (using rectangles)
    doc.setFillColor(139, 92, 246); // Purple
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 15, pageWidth, pageHeight - 30, 'F');
    doc.setFillColor(139, 92, 246);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

    // Border
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title
    doc.setFontSize(36);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 40, { align: 'center' });

    // Decorative line
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1);
    doc.line(60, 45, pageWidth - 60, 45);

    // Category badge
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(pageWidth / 2 - 30, 50, 60, 10, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(data.category.toUpperCase(), pageWidth / 2, 57, { align: 'center' });

    // "This is to certify that"
    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', pageWidth / 2, 75, { align: 'center' });

    // Student name
    doc.setFontSize(28);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(data.studentName, pageWidth / 2, 90, { align: 'center' });

    // Underline for name
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 60, 92, pageWidth / 2 + 60, 92);

    // Achievement text
    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.text('has been awarded this certificate for', pageWidth / 2, 105, { align: 'center' });

    // Achievement title
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'bold');
    doc.text(data.achievementTitle, pageWidth / 2, 120, { align: 'center' });

    // Description (if provided)
    if (data.description) {
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'italic');
        const descLines = doc.splitTextToSize(data.description, pageWidth - 80);
        doc.text(descLines, pageWidth / 2, 130, { align: 'center', maxWidth: pageWidth - 80 });
    }

    // Date
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    const dateText = data.achievementDate || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Date: ${dateText}`, 40, pageHeight - 40);

    // Issuer signature line
    doc.setLineWidth(0.5);
    doc.setDrawColor(107, 114, 128);
    doc.line(pageWidth - 100, pageHeight - 45, pageWidth - 30, pageHeight - 45);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(data.issuerName || 'Authorized Signatory', pageWidth - 65, pageHeight - 38, { align: 'center' });

    // Token ID (small, bottom right)
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Token ID: ${data.tokenId}`, pageWidth - 30, pageHeight - 25, { align: 'right' });

    // Blockchain verified badge
    doc.setFillColor(16, 185, 129);
    doc.circle(30, pageHeight - 30, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('✓', 30, pageHeight - 28, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('Blockchain Verified', 42, pageHeight - 28);

    return doc.output('blob');
};

export const generateCustomCertificatePDF = (data: CustomCertificateData): Blob => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 15, pageWidth, pageHeight - 30, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

    // Border
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title
    doc.setFontSize(36);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE', pageWidth / 2, 40, { align: 'center' });

    // Template name
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(pageWidth / 2 - 40, 48, 80, 10, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(data.templateName.toUpperCase(), pageWidth / 2, 55, { align: 'center' });

    // Decorative line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(60, 62, pageWidth - 60, 62);

    // "Presented to"
    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.text('This certificate is presented to', pageWidth / 2, 75, { align: 'center' });

    // Student name
    doc.setFontSize(28);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(data.studentName, pageWidth / 2, 90, { align: 'center' });

    // Underline
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 60, 92, pageWidth / 2 + 60, 92);

    // Custom fields
    let yPosition = 110;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    data.customFields.forEach((field, index) => {
        if (yPosition > pageHeight - 60) return; // Stop if running out of space

        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'bold');
        doc.text(`${field.name}:`, pageWidth / 2 - 80, yPosition);

        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(field.value, pageWidth / 2 - 20, yPosition);

        yPosition += 10;
    });

    // Date
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    const dateText = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Date: ${dateText}`, 40, pageHeight - 40);

    // Signature line
    doc.setLineWidth(0.5);
    doc.setDrawColor(107, 114, 128);
    doc.line(pageWidth - 100, pageHeight - 45, pageWidth - 30, pageHeight - 45);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(data.issuerName || 'Authorized Signatory', pageWidth - 65, pageHeight - 38, { align: 'center' });

    // Token ID
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Token ID: ${data.tokenId}`, pageWidth - 30, pageHeight - 25, { align: 'right' });

    // Blockchain verified badge
    doc.setFillColor(16, 185, 129);
    doc.circle(30, pageHeight - 30, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('✓', 30, pageHeight - 28, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('Blockchain Verified', 42, pageHeight - 28);

    return doc.output('blob');
};
