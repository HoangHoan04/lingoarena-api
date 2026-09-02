import { createHttpClient } from '~/common/core/network';
import { configEnv } from '~/config/env';

const {} = configEnv();
export const optionalApiConnector = createHttpClient({
  baseURL: '',
  timeout: 2 * 60 * 1000,
  beforeRequest: config => {
    return config;
  },
  handleError: err => {
    return err;
  },
  handleResponse: async res => {
    return res.data;
  },
});
