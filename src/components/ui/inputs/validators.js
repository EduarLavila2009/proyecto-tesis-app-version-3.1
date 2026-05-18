/**
 * Validaciones básicas para campos de formulario.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value, label = 'Este campo') {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed == null) {
    return `${label} es obligatorio`;
  }
  return null;
}

export function validateEmail(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'El correo es obligatorio';
  if (!EMAIL_REGEX.test(trimmed)) return 'Formato de correo no válido';
  return null;
}

export function validateNumber(value, { min, max, label = 'El valor' } = {}) {
  const trimmed = (value || '').trim();
  if (!trimmed) return `${label} es obligatorio`;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return 'Introduce un número válido';
  if (min != null && num < min) return `El valor mínimo es ${min}`;
  if (max != null && num > max) return `El valor máximo es ${max}`;
  return null;
}

export function validateText(value, { minLength = 1, label = 'Este campo' } = {}) {
  const trimmed = (value || '').trim();
  if (!trimmed) return `${label} es obligatorio`;
  if (trimmed.length < minLength) {
    return `Mínimo ${minLength} caracteres`;
  }
  return null;
}

/**
 * @param {'text'|'email'|'number'|'phone'} type
 */
export function validateByType(value, type, options = {}) {
  switch (type) {
    case 'email':
      return validateEmail(value);
    case 'number':
      return validateNumber(value, options);
    case 'phone':
      if (!value || !String(value).trim()) {
        return options.required ? 'El teléfono es obligatorio' : null;
      }
      return null;
    case 'text':
    default:
      return options.required
        ? validateText(value, { minLength: options.minLength ?? 1, label: options.label })
        : null;
  }
}
