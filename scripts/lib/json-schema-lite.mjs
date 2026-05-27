import { readFile } from 'fs/promises';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function escapeJsonPointerSegment(segment) {
  return segment.replaceAll('~', '~0').replaceAll('/', '~1');
}

function formatPath(pathSegments) {
  if (pathSegments.length === 0) return '$';
  let path = '$';
  for (const segment of pathSegments) {
    if (typeof segment === 'number') {
      path += `[${segment}]`;
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(segment)) {
      path += `.${segment}`;
    } else {
      path += `[${JSON.stringify(segment)}]`;
    }
  }
  return path;
}

function checkType(value, expectedType) {
  switch (expectedType) {
    case 'object':
      return isPlainObject(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function validateFormat(value, format) {
  if (typeof value !== 'string') return false;

  switch (format) {
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    case 'date-time':
      return !Number.isNaN(Date.parse(value));
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
    case 'uri':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    default:
      return true;
  }
}

function resolveRef(rootSchema, ref) {
  if (!ref.startsWith('#/')) {
    throw new Error(`Unsupported $ref: ${ref}`);
  }

  const parts = ref
    .slice(2)
    .split('/')
    .map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'));

  let current = rootSchema;
  for (const part of parts) {
    if (!isPlainObject(current) || !(part in current)) {
      throw new Error(`Unresolvable $ref: ${ref}`);
    }
    current = current[part];
  }

  return current;
}

function validateAgainstSchema(value, schema, rootSchema, pathSegments, errors) {
  if (!schema) return;

  if (schema.$ref) {
    validateAgainstSchema(value, resolveRef(rootSchema, schema.$ref), rootSchema, pathSegments, errors);
    return;
  }

  if (schema.oneOf) {
    const variantMatches = schema.oneOf.filter(candidate => {
      const candidateErrors = [];
      validateAgainstSchema(value, candidate, rootSchema, pathSegments, candidateErrors);
      return candidateErrors.length === 0;
    });

    if (variantMatches.length !== 1) {
      errors.push(`${formatPath(pathSegments)} should match exactly one schema variant`);
    }
    return;
  }

  if (schema.type) {
    const validType = Array.isArray(schema.type)
      ? schema.type.some(typeName => checkType(value, typeName))
      : checkType(value, schema.type);
    if (!validType) {
      const expected = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
      errors.push(`${formatPath(pathSegments)} should be ${expected}`);
      return;
    }
  }

  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    errors.push(`${formatPath(pathSegments)} should equal ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.some(option => JSON.stringify(option) === JSON.stringify(value))) {
    errors.push(`${formatPath(pathSegments)} should be one of ${schema.enum.map(v => JSON.stringify(v)).join(', ')}`);
  }

  if (schema.minimum !== undefined && typeof value === 'number' && value < schema.minimum) {
    errors.push(`${formatPath(pathSegments)} should be >= ${schema.minimum}`);
  }

  if (schema.pattern && typeof value === 'string') {
    const pattern = new RegExp(schema.pattern);
    if (!pattern.test(value)) {
      errors.push(`${formatPath(pathSegments)} should match ${schema.pattern}`);
    }
  }

  if (schema.format && !validateFormat(value, schema.format)) {
    errors.push(`${formatPath(pathSegments)} should match format ${schema.format}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${formatPath(pathSegments)} should contain at least ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${formatPath(pathSegments)} should contain at most ${schema.maxItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        validateAgainstSchema(item, schema.items, rootSchema, [...pathSegments, index], errors);
      });
    }
  }

  if (isPlainObject(value)) {
    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in value)) {
        errors.push(`${formatPath(pathSegments)} is missing required property ${requiredKey}`);
      }
    }

    const knownProperties = schema.properties ?? {};
    for (const [key, propertySchema] of Object.entries(knownProperties)) {
      if (key in value) {
        validateAgainstSchema(value[key], propertySchema, rootSchema, [...pathSegments, key], errors);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in knownProperties)) {
          errors.push(`${formatPath(pathSegments)} has unexpected property ${key}`);
        }
      }
    }
  }
}

export async function loadSchema(schemaPath) {
  return JSON.parse(await readFile(schemaPath, 'utf8'));
}

export function validateJsonSchema(value, schema) {
  const errors = [];
  validateAgainstSchema(value, schema, schema, [], errors);
  return errors;
}

export function toJsonPointer(pathSegments) {
  if (pathSegments.length === 0) return '';
  return `/${pathSegments.map(segment => escapeJsonPointerSegment(String(segment))).join('/')}`;
}
