import { exampleByField, exampleByType, Schemas } from '../example-generator.js';

function parseType(type: string | any, field: string) {
  if (typeof type === 'object' && type !== null && 'type' in type) {
    return type;
  }

  let isArray = false;
  if (typeof type === 'string' && type.includes('[]')) {
    type = type.replace('[]', '');
    isArray = true;
  }

  if (typeof type === 'string') {
    type = type.replace(/[;\r\n]/g, '').trim();
  }

  const prop: any = { type: type };
  const notRequired = field.includes('?');
  prop.nullable = notRequired;

  if (typeof type === 'string' && type.toLowerCase() === 'datetime') {
    prop.type = 'string';
    prop.format = 'date-time';
    prop.example = exampleByField('datetime');
  } else if (typeof type === 'string' && type.toLowerCase() === 'date') {
    prop.type = 'string';
    prop.format = 'date';
    prop.example = '2021-03-23';
  } else {
    const standardTypes = ['string', 'number', 'boolean', 'integer'];
    if (typeof type === 'string' && !standardTypes.includes(type.toLowerCase())) {
      delete prop.type;
      prop.$ref = `#/components/schemas/${type}`;
    } else {
      if (typeof type === 'string') {
        prop.type = type.toLowerCase();
      }
      prop.example = exampleByType(type) || exampleByField(field);
    }
  }

  if (isArray) {
    return {
      type: 'array',
      items: prop,
    };
  }

  return prop;
}

export function parseInterfaces(data: string, schemas: Schemas = {}) {
  data = data.replace(/\t/g, '').replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, '');

  let currentInterface = null;
  const interfaces = {};
  const interfaceDefinitions = new Map();

  const lines = data.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isDefault = line.startsWith('export default interface');

    if (line.startsWith('interface') || line.startsWith('export interface') || isDefault) {
      const sp = line.split(/\s+/);
      const idx = line.endsWith('}') ? sp.length - 1 : sp.length - 2;
      const name = sp[idx].split(/[{\s]/)[0];
      const extendedTypes = parseExtends(line);
      interfaceDefinitions.set(name, {
        extends: extendedTypes,
        properties: {},
        required: [],
        startLine: i,
      });
      currentInterface = name;
      continue;
    }

    if (currentInterface && line === '}') {
      currentInterface = null;
      continue;
    }

    if (
      currentInterface &&
      line &&
      !line.startsWith('//') &&
      !line.startsWith('/*') &&
      !line.startsWith('*')
    ) {
      const def = interfaceDefinitions.get(currentInterface);
      if (def) {
        const previousLine = i > 0 ? lines[i - 1].trim() : '';
        const isRequired = previousLine.includes('@required');

        const [prop, type] = line.split(':').map((s) => s.trim());
        if (prop && type) {
          const cleanProp = prop.replace('?', '');
          def.properties[cleanProp] = type.replace(';', '');

          if (isRequired || !prop.includes('?')) {
            def.required.push(cleanProp);
          }
        }
      }
    }
  }

  for (const [name, def] of interfaceDefinitions) {
    const allProperties = {};
    const requiredFields = new Set(def.required);

    for (const baseType of def.extends) {
      const baseSchema = schemas[baseType];
      if (baseSchema) {
        if (baseSchema.properties) {
          Object.assign(allProperties, baseSchema.properties);
        }

        if (baseSchema.required) {
          baseSchema.required.forEach((field) => requiredFields.add(field));
        }
      }
    }

    Object.assign(allProperties, def.properties);

    const parsedProperties = {};
    for (const [key, value] of Object.entries(allProperties)) {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        parsedProperties[key] = value;
      } else {
        parsedProperties[key] = parseType(value, key);
      }
    }

    const schema = {
      type: 'object',
      properties: parsedProperties,
      required: Array.from(requiredFields),
      description: `${name}${def.extends.length ? ` extends ${def.extends.join(', ')}` : ''} (Interface)`,
    };

    if (schema.required.length === 0) {
      delete schema.required;
    }

    interfaces[name] = schema;
  }

  return interfaces;
}

function parseExtends(line: string): string[] {
  const matches = line.match(/extends\s+([^{]+)/);
  if (!matches) return [];

  return matches[1]
    .split(',')
    .map((type) => type.trim())
    .map((type) => {
      const cleanType = type.split('/').pop();
      return cleanType?.replace(/\.ts$/, '') || type;
    });
}
