// ─── Shared layout ───────────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">TANKO</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;letter-spacing:2px;">FUEL LOGISTICS</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Tanko — Trustless Fuel Logistics
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#2563eb;border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:8px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">${label}</td>
  <td style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:500;border-bottom:1px solid #f1f5f9;">${value}</td>
</tr>`;
}

function infoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
  ${rows}
</table>`;
}

// ─── Template types ──────────────────────────────────────────────────────────

export interface WelcomeContext {
  driverName: string;
  managerName: string;
  dashboardUrl?: string;
}

export interface FuelRequestCreatedContext {
  driverName: string;
  managerName: string;
  liters: number;
  amount: number;
  description?: string;
  dashboardUrl?: string;
}

export interface EscrowLockedContext {
  driverName: string;
  liters: number;
  amount: number;
  contractId: string;
  dashboardUrl?: string;
}

export type TemplateName = 'welcome' | 'fuelRequestCreated' | 'escrowLocked';

export type TemplateContext = WelcomeContext | FuelRequestCreatedContext | EscrowLockedContext;

// ─── Template renderers ──────────────────────────────────────────────────────

function welcome(ctx: WelcomeContext): string {
  const cta = ctx.dashboardUrl ? button('Open Dashboard', ctx.dashboardUrl) : '';

  return layout('Welcome to Tanko', `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Welcome aboard, ${ctx.driverName}!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
      You have been registered as a driver on the <strong>Tanko</strong> platform by
      <strong>${ctx.managerName}</strong>. You can now receive fuel allocations and
      submit fuel logs directly from the dashboard.
    </p>
    ${infoTable(
      infoRow('Your Role', 'Driver (Conductor)') +
      infoRow('Fleet Manager', ctx.managerName)
    )}
    ${cta}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you did not expect this email, please contact your fleet manager.
    </p>
  `);
}

function fuelRequestCreated(ctx: FuelRequestCreatedContext): string {
  const cta = ctx.dashboardUrl ? button('Review Request', ctx.dashboardUrl) : '';

  return layout('New Fuel Request', `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">New Fuel Request</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
      Hi <strong>${ctx.managerName}</strong>, a new fuel request has been submitted by
      <strong>${ctx.driverName}</strong> and requires your review.
    </p>
    ${infoTable(
      infoRow('Driver', ctx.driverName) +
      infoRow('Liters Requested', `${ctx.liters} L`) +
      infoRow('Amount', `$${ctx.amount.toFixed(2)} USDC`) +
      (ctx.description ? infoRow('Description', ctx.description) : '')
    )}
    ${cta}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Please approve or reject this request from the Tanko dashboard.
    </p>
  `);
}

function escrowLocked(ctx: EscrowLockedContext): string {
  const shortContract = ctx.contractId.length > 16
    ? `${ctx.contractId.slice(0, 8)}…${ctx.contractId.slice(-8)}`
    : ctx.contractId;

  const cta = ctx.dashboardUrl ? button('View Escrow', ctx.dashboardUrl) : '';

  return layout('Escrow Locked — Ready to Fuel', `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Funds Locked &amp; Ready</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
      Hi <strong>${ctx.driverName}</strong>, funds for your fuel request have been
      successfully locked in an escrow contract on the Stellar network. You are now
      authorized to load fuel.
    </p>
    ${infoTable(
      infoRow('Liters Authorized', `${ctx.liters} L`) +
      infoRow('Amount Locked', `$${ctx.amount.toFixed(2)} USDC`) +
      infoRow('Contract', shortContract)
    )}
    ${cta}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Proceed to the authorized station to load fuel. The escrow will release
      automatically once your fuel log is verified.
    </p>
  `);
}

export const emailTemplates = {
  welcome,
  fuelRequestCreated,
  escrowLocked,
} as const;
