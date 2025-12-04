import { ProductData } from "@/types/product";

export function generateWhatsAppMessage(data: ProductData): string {
  const lines: string[] = [];

  // Product name header
  lines.push(`*${data.name}*`);
  lines.push("");

  // Store info
  if (data.storeName) {
    lines.push(`Visite a página e encontre todos os produtos de *${data.storeName}*`);
    lines.push("");
  }

  // Product name again
  lines.push(`📦 *${data.name}*`);
  lines.push("");

  // Prices
  lines.push(`~De R$ ${data.originalPrice}~`);
  
  if (data.hasCoupon && data.couponName) {
    lines.push(`*Por R$ ${data.discountPrice}* com o cupom *${data.couponName.toUpperCase()}*`);
    lines.push("");
    lines.push("🔥 *CUPOM COM USO LIMITADO, CORRA!*");
  } else {
    lines.push(`*Por R$ ${data.discountPrice}*`);
  }
  
  lines.push("");
  lines.push("Link do produto ⬇️");
  lines.push(data.productLink);

  return lines.join("\n");
}

export function formatCurrency(value: string): string {
  // Remove non-numeric characters except comma and dot
  const numericValue = value.replace(/[^\d.,]/g, "");
  
  // Convert to proper format
  const parts = numericValue.split(/[.,]/);
  if (parts.length > 1) {
    const integerPart = parts.slice(0, -1).join("");
    const decimalPart = parts[parts.length - 1];
    return `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimalPart.slice(0, 2)}`;
  }
  
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function createWhatsAppUrl(message: string, phoneNumber?: string): string {
  const encodedMessage = encodeURIComponent(message);
  const phone = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";
  // Using api.whatsapp.com which works on both mobile and desktop
  return phone 
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;
}
