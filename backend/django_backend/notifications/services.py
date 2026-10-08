from django.conf import settings
from django.core.mail import send_mail


def send_notification_email(
    recipient_email,
    subject,
    message,
):
    if not recipient_email:
        return False

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return True
    except Exception:
        return False