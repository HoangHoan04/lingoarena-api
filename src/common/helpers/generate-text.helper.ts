import dayjs from 'dayjs';
import { NSConfig } from '~/common/enums';

export const generateCurlText = (
  url: string,
  data: Record<string, any>,
  method = 'POST',
  header: any,
) => {
  const prettyBody = JSON.stringify(data, null, 2);
  return `curl --location '${url}' \\\n${Object.keys(header)
    .map(key => `--header '${key}: ${header[key]}' \\\n`)
    .join('')}--request ${method} \\\n--data '${prettyBody}'
    `;
};

export const generatePayloadFields = (details: any[]) => {
  const samplePayload: any = {};
  for (const d of details) {
    switch (d.type) {
      case NSConfig.ETypeField.TEXT:
        samplePayload[d.mappingField] = 'example';
        break;
      case NSConfig.ETypeField.NUMBER:
        samplePayload[d.mappingField] = 123;
        break;
      case NSConfig.ETypeField.BOOLEAN:
        samplePayload[d.mappingField] = true;
        break;
      case NSConfig.ETypeField.JSON:
        samplePayload[d.mappingField] = { sample: 'value' };
        break;
      case NSConfig.ETypeField.DATE:
        samplePayload[d.mappingField] = dayjs().format('YYYY-MM-DD');
        break;
      default:
        samplePayload[d.mappingField] = null;
    }
  }
  return samplePayload;
};
