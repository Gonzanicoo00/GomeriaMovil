<?php

namespace Gomeria\Helpers;

class VehiculoValidator
{
    /**
     * Valida los datos del vehiculo de un gomero (al registrarse o al editar su perfil).
     * Devuelve [vehiculo normalizado, errores].
     */
    public static function validar(mixed $vehiculo): array
    {
        $vehiculo = is_array($vehiculo) ? $vehiculo : [];
        $errors = [];
        foreach (Validator::validate($vehiculo, [
            'tipo' => 'required|in:moto,auto,camioneta',
            'marca_modelo' => 'required|min:2|max:80',
            'color' => 'required|min:3|max:30',
            'patente' => 'required',
        ]) as $campo => $mensajes) {
            $errors["vehiculo.{$campo}"] = $mensajes;
        }

        // Patentes argentinas: AAA123, AA123BB y las de moto (123ABC, A123BCD).
        $patente = strtoupper(preg_replace('/[\s.-]/', '', (string) ($vehiculo['patente'] ?? '')));
        if ($patente !== '' && !preg_match('/^[A-Z0-9]{6,7}$/', $patente)) {
            $errors['vehiculo.patente'][] = 'La patente no es valida';
        }

        $normalizado = [
            'tipo' => $vehiculo['tipo'] ?? null,
            'marca_modelo' => trim((string) ($vehiculo['marca_modelo'] ?? '')),
            'color' => trim((string) ($vehiculo['color'] ?? '')),
            'patente' => $patente,
        ];

        return [$normalizado, $errors];
    }
}
