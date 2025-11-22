import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'http://localhost:5000';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface SendPasswordResetEmailParams {
  to: string;
  resetToken: string;
  username: string;
}

interface SendUsernameReminderEmailParams {
  to: string;
  username: string;
}

export async function sendPasswordResetEmail({ 
  to, 
  resetToken, 
  username 
}: SendPasswordResetEmailParams) {
  const resetUrl = `${APP_URL}/reset-password/${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2E8BFF 0%, #18E0FF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2E8BFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 TecniFlux</h1>
            <p>Recuperación de Contraseña</p>
          </div>
          <div class="content">
            <h2>Hola, ${username}</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en TecniFlux.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en <strong>1 hora</strong></li>
                <li>Si no solicitaste este cambio, ignora este mensaje</li>
                <li>Nunca compartas este enlace con nadie</li>
              </ul>
            </div>
            <p>Gracias por usar TecniFlux,<br>El equipo de TecniFlux</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    if (!IS_PRODUCTION) {
      console.log('📧 [EMAIL SIMULATION] Password reset email would be sent to:', to);
      console.log('Reset URL:', resetUrl);
      console.log('Token expires in 1 hour');
    }
    return { success: true, simulation: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Restablecer Contraseña - TecniFlux',
      html,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send email');
    }

    console.log('✅ Password reset email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

export async function sendUsernameReminderEmail({ 
  to, 
  username 
}: SendUsernameReminderEmailParams) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2E8BFF 0%, #18E0FF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .username-box { background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; border: 2px solid #2E8BFF; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 TecniFlux</h1>
            <p>Recordatorio de Usuario</p>
          </div>
          <div class="content">
            <h2>Hola,</h2>
            <p>Recibimos una solicitud para recordarte tu nombre de usuario en TecniFlux.</p>
            <p>Tu información de acceso es:</p>
            <div class="username-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Usuario / Email:</p>
              <h3 style="margin: 10px 0; color: #2E8BFF;">${username}</h3>
            </div>
            <p>Puedes usar este usuario para iniciar sesión en TecniFlux.</p>
            <p>Si no solicitaste este recordatorio, puedes ignorar este mensaje de forma segura.</p>
            <p>Gracias por usar TecniFlux,<br>El equipo de TecniFlux</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    if (!IS_PRODUCTION) {
      console.log('📧 [EMAIL SIMULATION] Username reminder would be sent to:', to);
      console.log('Username:', username);
    }
    return { success: true, simulation: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Recordatorio de Usuario - TecniFlux',
      html,
    });

    if (error) {
      console.error('Error sending username reminder email:', error);
      throw new Error('Failed to send email');
    }

    console.log('✅ Username reminder email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error sending username reminder email:', error);
    throw error;
  }
}
