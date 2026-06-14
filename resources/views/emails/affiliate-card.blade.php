<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 24px; background: #f4f4f4;">
    <div style="max-width: 480px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
        <h2 style="margin-top: 0;">Red Comercial de Salones</h2>
        <p>Hola <strong>{{ $user->name }}</strong>,</p>
        <p>Adjuntamos los datos de tu carnet de afiliado:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nombre</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $member['name'] }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Membresía</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $member['id'] }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nivel</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $member['level'] }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Desde</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $member['since'] }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Vence</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $member['expires'] }}</td>
            </tr>
        </table>
        <p>Puedes imprimir tu carnet desde la plataforma.</p>
        <p style="color: #666; font-size: 13px;">Prototipo — sin valor fiscal</p>
    </div>
</body>
</html>
