<?php

namespace Gomeria\Helpers;

class FotoValidator
{
    /**
     * Valida la foto de la cara del gomero (JPEG o PNG en base64, sin el prefijo data:).
     * Devuelve [foto en base64 o null, errores].
     * Con $obligatoria = false, la foto puede no venir y se conserva la que ya tenia.
     */
    public static function validar(mixed $foto, bool $obligatoria): array
    {
        if (empty($foto) || !is_string($foto)) {
            return [null, $obligatoria ? ['foto' => ['Carga una foto de tu cara']] : []];
        }

        $binario = base64_decode($foto, true);
        $info = $binario !== false ? @getimagesizefromstring($binario) : false;
        if ($info === false || !in_array($info['mime'], ['image/jpeg', 'image/png'], true)) {
            return [null, ['foto' => ['La foto no es una imagen valida']]];
        }
        if (strlen($binario) > 2 * 1024 * 1024) {
            return [null, ['foto' => ['La foto es demasiado grande']]];
        }

        return [$foto, []];
    }
}
