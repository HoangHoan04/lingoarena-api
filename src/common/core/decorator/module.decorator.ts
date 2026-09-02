import { MODULE_PATH } from '@nestjs/common/constants';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { validateModuleKeys } from '@nestjs/common/utils/validate-module-keys.util';
import { ApiTags } from '@nestjs/swagger';

export interface IChildModuleMetadata extends ModuleMetadata {
  prefix?: string;
}

function fixPath(strInput: string) {
  let path = strInput;
  const regex = new RegExp('//', 'g');
  while (path.includes('//')) {
    path = path.replace(regex, '/');
  }

  const regexConfig = /(^\/+|\/+$)/gm;
  return path.replace(regexConfig, '');
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, match => match.toUpperCase()).replace(/[\s\-_/]+/g, '');
}

export function ChildModule(childMetadata?: IChildModuleMetadata): ClassDecorator {
  let { prefix = '', ...metadata } = childMetadata;
  const propsKeys = Object.keys(metadata);
  validateModuleKeys(propsKeys);
  return target => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, metadata[property], target);
      }
    }
    const defPrefix = fixPath(prefix);
    Reflect.defineMetadata(MODULE_PATH, defPrefix ? '/' + defPrefix : defPrefix, target);
    const data = metadata['imports'] || [];
    data.forEach(item => {
      try {
        const childPath = Reflect.getMetadata(MODULE_PATH, item) || '';
        const mixPath = fixPath(defPrefix + childPath);
        Reflect.defineMetadata(MODULE_PATH, mixPath ? '/' + mixPath : mixPath, item);
      } catch (error) {
        console.error(`Error processing module path for item:`, item, '\nError:', error);
      }
    });
    const controllers = metadata['controllers'] || [];
    controllers.forEach(ctr => {
      const groupName = prefix ? `[${toPascalCase(prefix)}] ${ctr.name}` : `[API]${ctr.name}`;
      ApiTags(groupName)(ctr);
    });
  };
}
