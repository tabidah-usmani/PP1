import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { getCurrentBusinessId } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const businessId = getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, businessId },
    include: { client: true, business: true, appointment: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.086, 0.188, 0.169); // matches --ink
  const gray = rgb(0.36, 0.42, 0.39);
  const line = rgb(0.89, 0.87, 0.8);

  let y = height - 60;

  // Header
  page.drawText("INVOICE", { x: 50, y, size: 24, font: bold, color: ink });
  page.drawText(invoice.business.name, { x: width - 50 - font.widthOfTextAtSize(invoice.business.name, 11), y: y + 4, size: 11, font, color: gray });
  y -= 40;

  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: line });
  y -= 30;

  // Invoice meta
  const metaLines = [
    [`Invoice #`, invoice.id.slice(0, 8).toUpperCase()],
    [`Date`, invoice.createdAt.toLocaleDateString()],
    [`Due`, invoice.dueDate ? invoice.dueDate.toLocaleDateString() : "—"],
    [`Status`, invoice.status.toUpperCase()],
  ];
  for (const [label, value] of metaLines) {
    page.drawText(label, { x: 50, y, size: 10, font, color: gray });
    page.drawText(value, { x: 150, y, size: 10, font: bold, color: ink });
    y -= 18;
  }
  y -= 12;

  // Bill to
  page.drawText("BILL TO", { x: 50, y, size: 9, font: bold, color: gray });
  y -= 16;
  page.drawText(invoice.client.name, { x: 50, y, size: 12, font: bold, color: ink });
  y -= 16;
  if (invoice.client.email) {
    page.drawText(invoice.client.email, { x: 50, y, size: 10, font, color: gray });
    y -= 14;
  }
  if (invoice.client.phone) {
    page.drawText(invoice.client.phone, { x: 50, y, size: 10, font, color: gray });
    y -= 14;
  }
  y -= 20;

  // Line item table
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: line });
  y -= 20;
  page.drawText("DESCRIPTION", { x: 50, y, size: 9, font: bold, color: gray });
  page.drawText("AMOUNT", { x: width - 110, y, size: 9, font: bold, color: gray });
  y -= 16;

  const description = invoice.appointment?.serviceName ?? "Service";
  page.drawText(description, { x: 50, y, size: 11, font, color: ink });
  const amountText = `$${invoice.amount.toFixed(2)}`;
  page.drawText(amountText, { x: width - 50 - font.widthOfTextAtSize(amountText, 11), y, size: 11, font, color: ink });
  y -= 30;

  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: line });
  y -= 24;

  // Totals
  const remaining = Math.max(0, invoice.amount - invoice.amountPaid);
  const totals: [string, string, boolean][] = [
    ["Total", `$${invoice.amount.toFixed(2)}`, false],
    ["Paid", `$${invoice.amountPaid.toFixed(2)}`, false],
    ["Balance due", `$${remaining.toFixed(2)}`, true],
  ];
  for (const [label, value, emphasize] of totals) {
    const f = emphasize ? bold : font;
    const size = emphasize ? 13 : 11;
    page.drawText(label, { x: width - 220, y, size, font: f, color: emphasize ? ink : gray });
    page.drawText(value, { x: width - 50 - f.widthOfTextAtSize(value, size), y, size, font: f, color: ink });
    y -= emphasize ? 22 : 18;
  }

  y -= 30;
  page.drawText("Thank you for your business.", { x: 50, y, size: 10, font, color: gray });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.id.slice(0, 8)}.pdf"`,
    },
  });
}