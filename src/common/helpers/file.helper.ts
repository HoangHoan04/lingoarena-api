import axios from 'axios';

const downloadAndConvertToBase64 = async (url: string): Promise<string> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  const mimeType = 'image/png';
  const base64String = buffer.toString('base64');
  return `data:${mimeType};base64,${base64String}`;
};

export const fileHelper = {
  downloadAndConvertToBase64,
};
