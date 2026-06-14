<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 24px; background: #f4f4f4;">
    <div style="max-width: 480px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
        <h2 style="margin-top: 0;">Red Comercial de Salones</h2>
        <p>Hola <strong>{{ $user->name }}</strong>,</p>
        <p>Tu solicitud de registro ha sido recibida. Estas son tus credenciales de acceso:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $user->email }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Contraseña</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $plainPassword }}</td>
            </tr>
        </table>
        <p><strong>Nota:</strong> Tu cuenta está pendiente de aprobación por un líder o administrador. Recibirás un correo cuando sea activada.</p>
        <p style="color: #666; font-size: 13px;">Prototipo — sin valor fiscal</p>
    </div>
</body>
</html>
