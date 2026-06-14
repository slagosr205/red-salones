<?php

namespace App\Services;

use Mike42\Escpos\PrintConnectors\DummyPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\Printer;
use RuntimeException;

class ReceiptPrinter
{
    private Printer $printer;

    private int $lineLength;

    /**
     * @param array{
     *     receiptId: string,
     *     date: string,
     *     customerName: string,
     *     companyName: string,
     *     companyAddress: string,
     *     companyPhone: string,
     *     companyEmail: string,
     *     items: array<int, array{name: string, qty: int, price: float, discount: float, promo: ?string}>,
     *     subtotal: float,
     *     totalDiscount: float,
     *     isv: float,
     *     grandTotal: float,
     * } $data
     */
    public function __construct(
        private readonly array $data,
    ) {
        $this->lineLength = config('printing.line_length', 42);
        $this->printer = $this->connect();
    }

    private function connect(): Printer
    {
        $type = config('printing.connection_type', 'dummy');

        $connector = match ($type) {
            'windows' => new WindowsPrintConnector(config('printing.windows.printer_name')),
            'network' => new NetworkPrintConnector(
                config('printing.network.ip'),
                config('printing.network.port'),
            ),
            'file' => new FilePrintConnector(config('printing.file.path')),
            default => new DummyPrintConnector,
        };

        return new Printer($connector, null);
    }

    public function print(): string
    {
        $d = $this->data;
        $w = $this->lineLength;

        try {
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $this->printer->text($d['companyName']."\n");
            $this->printer->selectPrintMode();
            $this->printer->text($d['companyAddress']."\n");
            $this->printer->text("Tel: {$d['companyPhone']} | {$d['companyEmail']}\n");

            $this->printer->feed();
            $this->printer->text(str_repeat('-', $w)."\n");
            $this->printer->feed();

            $this->printer->setJustification(Printer::JUSTIFY_LEFT);
            $this->printer->text("# {$d['receiptId']}".str_repeat(' ', max(0, $w - 8 - strlen($d['receiptId']) - strlen($d['date'])))."{$d['date']}\n");
            $this->printer->text("Cliente: {$d['customerName']}\n");

            $this->printer->feed();
            $this->printer->text(str_repeat('-', $w)."\n");

            foreach ($d['items'] as $item) {
                $name = mb_strlen($item['name']) > 22 ? mb_substr($item['name'], 0, 20).'..' : $item['name'];
                $promo = $item['promo'] ? " [{$item['promo']}]" : '';
                $neto = $item['price'] * $item['qty'] - $item['discount'];
                $priceStr = 'L '.number_format($item['price'], 2);
                $qtyStr = "x{$item['qty']}";
                $netoStr = 'L '.number_format($neto, 2);

                $this->printer->setEmphasis(true);
                $this->printer->text("{$name}{$promo}\n");
                $this->printer->setEmphasis(false);

                $line = "  {$priceStr} {$qtyStr}";
                $padding = max(0, $w - mb_strlen($line) - mb_strlen($netoStr) - 1);
                $this->printer->text("{$line}".str_repeat(' ', $padding)." {$netoStr}\n");

                if ($item['discount'] > 0) {
                    $this->printer->text('  Dto: -L '.number_format($item['discount'], 2)."\n");
                }
            }

            $this->printer->feed();
            $this->printer->text(str_repeat('-', $w)."\n");

            $this->printer->setJustification(Printer::JUSTIFY_RIGHT);
            $this->printer->text('Subtotal: L '.number_format($d['subtotal'], 2)."\n");

            if ($d['totalDiscount'] > 0) {
                $this->printer->text('Descuento: -L '.number_format($d['totalDiscount'], 2)."\n");
            }

            $this->printer->setEmphasis(true);
            $this->printer->text('ISV (15%): L '.number_format($d['isv'], 2)."\n");
            $this->printer->setEmphasis(false);

            $this->printer->text(str_repeat('-', $w)."\n");

            $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $this->printer->text('TOTAL: L '.number_format($d['grandTotal'], 2)."\n");
            $this->printer->selectPrintMode();

            $this->printer->feed(2);
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            $this->printer->text("Gracias por su compra\n");

            $this->printer->setTextSize(1, 1);
            $this->printer->text("Prototipo — sin valor fiscal\n");

            $this->printer->feed(3);
            $this->printer->cut();

            $this->printer->close();

            if (config('printing.connection_type') === 'dummy') {
                return 'impresion simulada (dummy)';
            }

            return 'impresion enviada a la impresora';
        } catch (\Exception $e) {
            throw new RuntimeException('Error al imprimir: '.$e->getMessage());
        }
    }
}
