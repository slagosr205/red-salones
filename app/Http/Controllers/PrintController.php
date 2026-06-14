<?php

namespace App\Http\Controllers;

use App\Services\ReceiptPrinter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrintController extends Controller
{
    public function printReceipt(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiptId' => 'required|string|max:50',
            'date' => 'required|string|max:20',
            'customerName' => 'required|string|max:255',
            'companyName' => 'required|string|max:255',
            'companyAddress' => 'required|string|max:255',
            'companyPhone' => 'required|string|max:100',
            'companyEmail' => 'required|string|email|max:255',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'required|numeric|min:0',
            'items.*.promo' => 'nullable|string|max:20',
            'subtotal' => 'required|numeric|min:0',
            'totalDiscount' => 'required|numeric|min:0',
            'isv' => 'required|numeric|min:0',
            'grandTotal' => 'required|numeric|min:0',
        ]);

        try {
            $printer = new ReceiptPrinter($validated);
            $message = $printer->print();

            return response()->json(['success' => true, 'message' => $message]);
        } catch (\Exception $e) {
            Log::error('Error printing receipt: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al imprimir: '.$e->getMessage(),
            ], 500);
        }
    }
}
