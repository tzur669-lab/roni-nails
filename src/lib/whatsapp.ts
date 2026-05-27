import { buildGoogleCalendarLink } from "./google-calendar";
import { formatHebrewFullDate } from "./hebrew-calendar";

interface WhatsAppParams {
  clientPhone: string;
  clientName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  clinicAddress: string;
}

export function buildWhatsAppApprovalLink(params: WhatsAppParams): string {
  const { clientPhone, clientName, serviceName, startTime, endTime, clinicAddress } = params;

  const dateStr = formatHebrewFullDate(startTime);
  const timeStr = startTime.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const calLink = buildGoogleCalendarLink({
    title: "תור ללק רני חנימוב",
    startTime,
    endTime,
    description: `שירות: ${serviceName}`,
    location: clinicAddress,
  });

  const message = [
    `היי ${clientName}! 🌸`,
    `התורה שלך אושרה ✓`,
    ``,
    `שירות: ${serviceName}`,
    `תאריך: ${dateStr}`,
    `שעה: ${timeStr}`,
    ``,
    `להוספה לגוגל קלנדר:`,
    calLink,
    ``,
    `מחכה לך! 💅`,
  ].join("\n");

  const phone = clientPhone.replace(/\D/g, "").replace(/^0/, "972");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppCancellationLink(params: WhatsAppParams): string {
  const { clientPhone, clientName, serviceName, startTime } = params;

  const dateStr = formatHebrewFullDate(startTime);
  const timeStr = startTime.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = [
    `היי ${clientName} 🌸`,
    `לצערנו נאלצנו לבטל את התורה שלך.`,
    ``,
    `שירות: ${serviceName}`,
    `תאריך: ${dateStr}`,
    `שעה: ${timeStr}`,
    ``,
    `ניתן לקבוע תור חדש דרך האפליקציה.`,
    `מצטערים על אי הנוחות! 💅`,
  ].join("\n");

  const phone = clientPhone.replace(/\D/g, "").replace(/^0/, "972");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppContactLink(whatsappNumber: string): string {
  const phone = whatsappNumber.replace(/\D/g, "").replace(/^0/, "972");
  return `https://wa.me/${phone}`;
}
