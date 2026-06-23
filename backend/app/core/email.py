import json
import urllib.request
import urllib.error
from app.core.config import settings


def send_code_email(to_email: str, code: str, code_type: str) -> None:
    if code_type == "signup":
        subject = "VisionCare — Code de vérification d'email"
        action = "valider votre inscription"
    else:
        subject = "VisionCare — Réinitialisation du mot de passe"
        action = "réinitialiser votre mot de passe"

    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#020B18;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:rgba(4,20,42,0.97);
              border:1px solid rgba(0,180,255,0.22);border-radius:16px;padding:40px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:22px;font-weight:bold;color:#00D4FF;letter-spacing:2px;">
        VisionCare
      </span>
    </div>
    <p style="color:#C8E8FF;font-size:15px;margin-bottom:8px;">
      Utilisez ce code pour <strong>{action}</strong> :
    </p>
    <div style="font-size:40px;font-weight:bold;letter-spacing:16px;color:#00D4FF;
                text-align:center;padding:24px 16px;
                background:rgba(0,50,100,0.35);
                border:1px solid rgba(0,180,255,0.2);
                border-radius:12px;margin:24px 0;">
      {code}
    </div>
    <p style="color:rgba(150,210,255,0.65);font-size:13px;line-height:1.6;">
      Ce code expire dans <strong style="color:#C8E8FF;">10 minutes</strong>.<br/>
      Si vous n'avez pas effectué cette demande, ignorez cet email.
    </p>
    <div style="margin-top:32px;padding-top:20px;
                border-top:1px solid rgba(0,180,255,0.12);
                text-align:center;color:rgba(80,140,180,0.5);font-size:11px;">
      © 2025 VisionCare — Plateforme sécurisée
    </div>
  </div>
</body>
</html>"""

    payload = json.dumps({
        "from": settings.EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise Exception(f"Resend API error {e.code}: {error_body}")
    except urllib.error.URLError as e:
        raise Exception(f"Erreur réseau Resend: {e.reason}")
