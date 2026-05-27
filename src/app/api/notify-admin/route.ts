import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyPayload {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startTime: string; // ISO string
  isGuest: boolean;
  appointmentId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { clientName, clientPhone, serviceName, startTime, isGuest, appointmentId } =
      (await req.json()) as NotifyPayload;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || !process.env.RESEND_API_KEY) {
      // Env vars not configured — skip silently (don't break booking flow)
      return NextResponse.json({ ok: true, skipped: true });
    }

    const date = new Date(startTime);
    const dateStr = date.toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const guestLabel = isGuest ? " (אורח/ת ללא חשבון)" : "";

    // Build direct approval link
    const origin = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;
    const approvalUrl = appointmentId
      ? `${origin}/admin/appointments`
      : `${origin}/admin/appointments`;

    await resend.emails.send({
      from: "Roni Nails <onboarding@resend.dev>",
      to: adminEmail,
      subject: `💅 תור חדש — ${clientName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fdf6f0; border-radius: 16px;">
          <h2 style="color: #c9a882; margin-bottom: 8px;">💅 בקשת תור חדשה!</h2>
          <p style="color: #555; margin-bottom: 24px;">התקבלה בקשת תור חדשה מ-<strong>${clientName}</strong>.</p>

          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #f0e8e0;">
              <td style="padding: 12px 16px; color: #888; width: 35%;">שם</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #333;">${clientName}${guestLabel}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0e8e0;">
              <td style="padding: 12px 16px; color: #888;">טלפון</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #333; direction: ltr;">${clientPhone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0e8e0;">
              <td style="padding: 12px 16px; color: #888;">שירות</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #333;">${serviceName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0e8e0;">
              <td style="padding: 12px 16px; color: #888;">תאריך</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #333;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; color: #888;">שעה</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #333;">${timeStr}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; text-align: center;">
            <a
              href="${approvalUrl}"
              style="display: inline-block; padding: 14px 32px; background: #c9a882; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;"
            >
              ✓ לאישור / דחיית התור
            </a>
          </div>

          <p style="margin-top: 16px; color: #888; font-size: 13px; text-align: center;">
            לחצי על הכפתור כדי לאשר או לדחות את הבקשה
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-admin] email error:", err);
    // Don't return 500 — we don't want a failed email to break the booking
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
