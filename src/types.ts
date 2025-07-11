/**
 * AdonisOpenapi interfaces
 */
export interface AdonisOpenapiOptions {
  title?: string;
  ignore: string[];
  version?: string;
  description?: string;
  path: string;
  tagIndex: number;
  snakeCase: boolean;
  common: common;
  fileNameInSummary?: boolean;
  preferredPutPatch?: string;
  persistAuthorization?: boolean;
  appPath?: string;
  debug?: boolean;
  info?: any;
  securitySchemes?: any;
  productionEnv?: string;
  authMiddlewares?: string[];
  defaultSecurityScheme?: string;
  outputFileExtensions?: 'both' | 'json' | 'yaml';
}

export interface common {
  headers: any;
  parameters: any;
}

/**
 * Adonis.JS routes
 */
export interface AdonisRouteMeta {
  resolvedHandler: {
    type: string;
    namespace?: string;
    method?: string;
  };
  resolvedMiddleware: Array<{
    type: string;
    args?: any[];
  }>;
}

export interface v6Handler {
  method?: string;
  moduleNameOrPath?: string;
  reference: string | any[];
  name: string;
}

export interface AdonisRoute {
  methods: string[];
  pattern: string;
  meta: AdonisRouteMeta;
  middleware: string[] | any;
  name?: string;
  params: string[];
  handler?: string | v6Handler;
}

export interface AdonisRoutes {
  root: AdonisRoute[];
}

export const standardTypes = [
  'string',
  'number',
  'integer',
  'datetime',
  'date',
  'boolean',
  'any',
].flatMap((type) => [type, `${type}[]`]);
