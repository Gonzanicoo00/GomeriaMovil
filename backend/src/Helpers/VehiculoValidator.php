<?php

namespace Gomeria\Helpers;

class VehiculoValidator
{
    /**
     * Valida los datos del vehiculo de un gomero (al registrarse o al editar su perfil).
     * Devuelve [vehiculo normalizado, foto en base64 o null, errores].
     * Con $fotoObligatoria = false, la foto puede no venir y se conserva la que ya tenia.
     */
    public static function validar(mixed $vehiculo, bool $fotoObligatoria): array
    {
        $vehiculo = is_array($vehiculo) ? $vehiculo : [];
        $errors = [];
        foreach (Validator::validate($vehiculo, [
            'tipo' => 'required|in:moto,auto,camioneta',
            'marca_modelo' => 'required|min:2|max:80',
            'color' => 'required|min:3|max:30',
            'patente' => 'required',
            'foto' => $fotoObligatoria ? 'required' : '',
        ]) as $campo => $mensajes) {
            $errors["vehiculo.{$campo}"] = $mensajes;
        }

        // Patentes argentinas: AAA123, AA123BB y las de moto (123ABC, A123BCD).
        $patente = strtoupper(preg_replace('/[\s.-]/', '', (string) ($vehiculo['patente'] ?? '')));
        if ($patente !== '' && !preg_match('/^[A-Z0-9]{6,7}$/', $patente)) {
            $errors['vehiculo.patente'][] = 'La patente no es valida';
        }

        $foto = null;
        if (!empty($vehiculo['foto']) && is_string($vehiculo['foto'])) {
            $binario = base64_decode($vehiculo['foto'], true);
            $info = $binario !== false ? @getimagesizefromstring($binario) : false;
            if ($info === false || !in_array($info['mime'], ['image/jpeg', 'image/png'], true)) {
                $errors['vehiculo.foto'][] = 'La foto del vehiculo no es una imagen valida';
            } elseif (strlen($binario) > 2 * 1024 * 1024) {
                $errors['vehiculo.foto'][] = 'La foto del vehiculo es demasiado grande';
            } else {
                $foto = $vehiculo['foto'];
            }
        }

        $normalizado = [
            'tipo' => $vehiculo['tipo'] ?? null,
            'marca_modelo' => trim((string) ($vehiculo['marca_modelo'] ?? '')),
            'color' => trim((string) ($vehiculo['color'] ?? '')),
            'patente' => $patente,
        ];

        return [$normalizado, $foto, $errors];
    }
}
