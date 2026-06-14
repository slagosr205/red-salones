<?php

return [
    /*
    |--------------------------------------------------------------------------
    | POS Printer Configuration
    |--------------------------------------------------------------------------
    |
    | connection_type: 'windows' | 'network' | 'file' | 'dummy'
    |   - windows: uses WindowsPrintConnector (SMB printer share)
    |   - network: uses NetworkPrintConnector (TCP/IP, port 9100 default)
    |   - file: uses FilePrintConnector (LPT1, COM1, /dev/usb/lp0)
    |   - dummy: uses DummyPrintConnector (captures output, useful for testing)
    |
    | printer_name: Windows printer name (e.g. "EPSON TM-T20II")
    | ip / port: network printer IP and port
    | path: file/device path
    |
    | line_length: characters per line (42 for 80mm, 32 for 58mm)
    | character_table: encoding table (see Escpos docs)
    |
    */

    'connection_type' => env('PRINTER_CONNECTION', 'dummy'),

    'windows' => [
        'printer_name' => env('PRINTER_NAME', 'POS-80'),
    ],

    'network' => [
        'ip' => env('PRINTER_IP', '192.168.1.100'),
        'port' => env('PRINTER_PORT', 9100),
    ],

    'file' => [
        'path' => env('PRINTER_PATH', 'LPT1'),
    ],

    'line_length' => env('PRINTER_LINE_LENGTH', 42),
    'character_table' => env('PRINTER_CHAR_TABLE', 'CP437'),
];
