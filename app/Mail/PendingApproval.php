<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PendingApproval extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $plainPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tus credenciales de acceso — Red Comercial de Salones',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.pending-approval',
        );
    }
}
