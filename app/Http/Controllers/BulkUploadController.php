<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BulkUploadController extends Controller
{
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="plantilla_articulos.csv"',
        ];

        $columns = [
            'nombre',
            'marca',
            'categoria',
            'precio',
            'precio_lider',
            'precio_publico',
            'stock',
            'stock_minimo',
            'puntos',
            'resumen',
            'destacado',
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for UTF-8
            fputcsv($file, $columns);
            fputcsv($file, [
                'Shampoo Ejemplo',
                'Marca Ejemplo',
                'Shampoo',
                '250.00',
                '200.00',
                '300.00',
                '50',
                '10',
                '100',
                'Descripcion del producto',
                'si',
            ]);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function uploadArticles(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        if (! $handle) {
            return back()->with('error', 'No se pudo leer el archivo.');
        }

        // Detect and skip BOM
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF).chr(0xBB).chr(0xBF)) {
            rewind($handle);
        }

        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);

            return back()->with('error', 'El archivo CSV no tiene encabezados.');
        }

        $header = array_map('trim', $header);
        $categoryMap = array_combine(
            array_map('strtolower', Article::CATEGORIES),
            Article::CATEGORIES
        );

        $authUser = $request->user();
        $imported = 0;
        $errors = [];

        $lineNumber = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;
            $data = array_combine($header, array_map('trim', $row));

            if (empty($data['nombre'])) {
                $errors[] = "Linea {$lineNumber}: falta el nombre.";

                continue;
            }

            $category = null;
            if (! empty($data['categoria'])) {
                $catKey = strtolower($data['categoria']);
                $category = $categoryMap[$catKey] ?? null;
                if (! $category) {
                    $errors[] = "Linea {$lineNumber}: categoria '{$data['categoria']}' no valida. Usar: ".implode(', ', Article::CATEGORIES);

                    continue;
                }
            }

            try {
                Article::query()->create([
                    'name' => $data['nombre'],
                    'brand' => $data['marca'] ?? null,
                    'category' => $category,
                    'price' => ! empty($data['precio']) ? (float) $data['precio'] : null,
                    'leader_price' => ! empty($data['precio_lider']) ? (float) $data['precio_lider'] : null,
                    'public_price' => ! empty($data['precio_publico']) ? (float) $data['precio_publico'] : null,
                    'stock' => ! empty($data['stock']) ? (int) $data['stock'] : 0,
                    'min_stock' => ! empty($data['stock_minimo']) ? (int) $data['stock_minimo'] : 0,
                    'points' => ! empty($data['puntos']) ? (int) $data['puntos'] : 0,
                    'summary' => $data['resumen'] ?? null,
                    'is_featured' => in_array(strtolower($data['destacado'] ?? ''), ['si', 'yes', '1', 'true']),
                    'created_by' => $authUser->id,
                ]);
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Linea {$lineNumber}: {$e->getMessage()}";
            }
        }

        fclose($handle);

        $message = "{$imported} articulos importados correctamente.";
        if (! empty($errors)) {
            $message .= ' Errores: '.implode(' | ', array_slice($errors, 0, 10));
            if (count($errors) > 10) {
                $message .= ' (y '.(count($errors) - 10).' mas)';
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => $imported > 0,
                'message' => $message,
                'imported' => $imported,
                'errors' => $errors,
            ]);
        }

        return back()->with($imported > 0 ? 'success' : 'error', $message);
    }

    public function uploadStock(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'mode' => ['required', 'string', 'in:set,increment'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        if (! $handle) {
            return back()->with('error', 'No se pudo leer el archivo.');
        }

        // Detect and skip BOM
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF).chr(0xBB).chr(0xBF)) {
            rewind($handle);
        }

        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);

            return back()->with('error', 'El archivo CSV no tiene encabezados.');
        }

        $header = array_map('trim', $header);
        $mode = $request->input('mode', 'set');
        $updated = 0;
        $errors = [];

        $lineNumber = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;
            $data = array_combine($header, array_map('trim', $row));

            if (empty($data['nombre']) && empty($data['id'])) {
                $errors[] = "Linea {$lineNumber}: falta 'nombre' o 'id'.";

                continue;
            }

            $article = null;
            if (! empty($data['id'])) {
                $article = Article::query()->find((int) $data['id']);
            } elseif (! empty($data['nombre'])) {
                $article = Article::query()->where('name', $data['nombre'])->first();
            }

            if (! $article) {
                $errors[] = "Linea {$lineNumber}: articulo no encontrado ('{$data['nombre']}').";

                continue;
            }

            $qty = (int) ($data['stock'] ?? 0);
            if ($qty < 0) {
                $errors[] = "Linea {$lineNumber}: el stock no puede ser negativo.";

                continue;
            }

            try {
                $stockBefore = $article->stock ?? 0;

                if ($mode === 'set') {
                    $article->update(['stock' => $qty]);
                } else {
                    $article->increment('stock', $qty);
                }

                $stockAfter = $article->fresh()->stock;

                InventoryMovement::query()->create([
                    'article_id' => $article->id,
                    'type' => 'adjustment',
                    'quantity' => $stockAfter - $stockBefore,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'note' => 'Carga masiva: '.($mode === 'set' ? 'asignar' : 'incrementar'),
                ]);

                $updated++;
            } catch (\Exception $e) {
                $errors[] = "Linea {$lineNumber}: {$e->getMessage()}";
            }
        }

        fclose($handle);

        $message = "{$updated} articulos actualizados correctamente.";
        if (! empty($errors)) {
            $message .= ' Errores: '.implode(' | ', array_slice($errors, 0, 10));
            if (count($errors) > 10) {
                $message .= ' (y '.(count($errors) - 10).' mas)';
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => $updated > 0,
                'message' => $message,
                'updated' => $updated,
                'errors' => $errors,
            ]);
        }

        return back()->with($updated > 0 ? 'success' : 'error', $message);
    }
}
