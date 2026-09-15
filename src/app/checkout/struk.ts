import { formatRupiah } from "@/lib/format";
import type { ProductWithStock } from "@/lib/types";

type ReceiptInput = {
  invoice: string;
  buyerName: string;
  items: { product: ProductWithStock; quantity: number }[];
  total: number;
  methodLabel: string;
};

const METHOD_LABEL: Record<string, string> = {
  qris: "QRIS",
  cash: "Tunai",
  deposit: "Potong Saldo",
  debt: "Kasbon",
};

export function methodLabel(method: string): string {
  return METHOD_LABEL[method] ?? method;
}

export function printReceipt({ invoice, buyerName, items, total, methodLabel: method }: ReceiptInput) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;

  const rows = items
    .map(
      (i) => `
        <tr>
          <td>${escapeHtml(i.product.name)}<div class="qty">${i.quantity} x ${formatRupiah(i.product.retail_price)}</div></td>
          <td class="right">${formatRupiah(i.product.retail_price * i.quantity)}</td>
        </tr>`
    )
    .join("");

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Struk ${escapeHtml(invoice)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 13px; color: #1a1a1a; padding: 16px; max-width: 320px; margin: 0 auto; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 2px; letter-spacing: 0.08em; }
  .sub { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; vertical-align: top; }
  .right { text-align: right; white-space: nowrap; }
  .qty { font-size: 11px; color: #666; }
  .total-row td { font-weight: bold; font-size: 14px; padding-top: 8px; }
  .meta { font-size: 11px; color: #444; margin-bottom: 2px; }
  .footer { text-align: center; font-size: 11px; color: #666; margin-top: 14px; }
</style></head>
<body>
  <h1>TOKO MARTINEZ</h1>
  <p class="sub">at Symphonia</p>
  <div class="meta">No. Nota: ${escapeHtml(invoice)}</div>
  <div class="meta">Tanggal: ${new Date().toLocaleString("id-ID")}</div>
  <div class="meta">Warga: ${escapeHtml(buyerName)}</div>
  <div class="meta">Metode: ${escapeHtml(method)}</div>
  <hr>
  <table>
    ${rows}
    <tr class="total-row"><td>TOTAL</td><td class="right">${formatRupiah(total)}</td></tr>
  </table>
  <hr>
  <p class="footer">Terima kasih sudah belanja jujur 🙏</p>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function whatsappReceiptUrl({
  phone,
  invoice,
  buyerName,
  items,
  total,
  methodLabel: method,
}: ReceiptInput & { phone: string }) {
  const lines = [
    `*Toko Martinez at Symphonia*`,
    `No. Nota: ${invoice}`,
    `Warga: ${buyerName}`,
    "",
    ...items.map(
      (i) => `${i.quantity}x ${i.product.name} — ${formatRupiah(i.product.retail_price * i.quantity)}`
    ),
    "",
    `Total: ${formatRupiah(total)} (${method})`,
    "",
    "Terima kasih sudah belanja jujur 🙏",
  ];
  const text = encodeURIComponent(lines.join("\n"));
  const digits = phone.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${digits}?text=${text}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
