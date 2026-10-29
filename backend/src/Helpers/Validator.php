<?php

namespace Gomeria\Helpers;

class Validator
{
    /**
     * Valida $data contra reglas simples separadas por '|'.
     * Reglas soportadas: required, email, min:N, max:N, numeric, in:a,b,c
     * Devuelve un array de errores (vacio si es valido).
     */
    public static function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $fieldRules = explode('|', $ruleString);

            foreach ($fieldRules as $rule) {
                [$ruleName, $param] = array_pad(explode(':', $rule, 2), 2, null);

                if ($ruleName === 'required' && ($value === null || $value === '')) {
                    $errors[$field][] = "El campo {$field} es obligatorio";
                    continue 2;
                }

                if ($value === null || $value === '') {
                    continue;
                }

                switch ($ruleName) {
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[$field][] = "El campo {$field} debe ser un email valido";
                        }
                        break;
                    case 'min':
                        if (is_string($value) && mb_strlen($value) < (int) $param) {
                            $errors[$field][] = "El campo {$field} debe tener al menos {$param} caracteres";
                        } elseif (!is_string($value) && is_numeric($value) && $value < (float) $param) {
                            $errors[$field][] = "El campo {$field} debe ser mayor o igual a {$param}";
                        }
                        break;
                    case 'max':
                        if (is_string($value) && mb_strlen($value) > (int) $param) {
                            $errors[$field][] = "El campo {$field} debe tener como maximo {$param} caracteres";
                        } elseif (!is_string($value) && is_numeric($value) && $value > (float) $param) {
                            $errors[$field][] = "El campo {$field} debe ser menor o igual a {$param}";
                        }
                        break;
                    case 'numeric':
                        if (!is_numeric($value)) {
                            $errors[$field][] = "El campo {$field} debe ser numerico";
                        }
                        break;
                    case 'in':
                        $options = explode(',', (string) $param);
                        if (!in_array($value, $options, true)) {
                            $errors[$field][] = "El campo {$field} debe ser uno de: {$param}";
                        }
                        break;
                }
            }
        }

        return $errors;
    }
}
