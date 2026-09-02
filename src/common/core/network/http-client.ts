import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';

export interface IHttpClientConfig extends CreateAxiosDefaults {
  beforeRequest?: <TDataRequest = any>(
    config: InternalAxiosRequestConfig<TDataRequest>,
  ) => InternalAxiosRequestConfig<TDataRequest> | Promise<InternalAxiosRequestConfig<TDataRequest>>;
  handleError?: (err: AxiosError<any, any>) => any;
  handleResponse?: <TDataResponse = any>(
    response: AxiosResponse<TDataResponse>,
  ) => TDataResponse | Promise<TDataResponse>;
}

export interface IRequestConfigBase<TDataRequest = any> extends Omit<
  AxiosRequestConfig<TDataRequest>,
  'params' | 'data' | 'paramsSerializer'
> {
  paramsSerializer?: any;
}

export interface IRequestConfigParams<TDataRequest = any> extends IRequestConfigBase<TDataRequest> {
  params?: TDataRequest;
}

export interface IRequestConfigBody<TDataRequest = any> extends IRequestConfigBase<TDataRequest> {
  data?: TDataRequest;
}

export interface IRequestConfig<TDataRequest = any> extends IRequestConfigBase<TDataRequest> {
  data?: TDataRequest;
  params?: TDataRequest;
}

const HttpClient = (baseConfig: IHttpClientConfig = {}) => {
  const { beforeRequest, handleError, handleResponse, ...configInit } = baseConfig;

  const instanceApi = axios.create(configInit);

  if (beforeRequest) {
    instanceApi.interceptors.request.use(
      async config => beforeRequest(config),
      error => Promise.reject(error),
    );
  }

  const executeApi = async <TDataResponse = any>(
    responsePromise: Promise<AxiosResponse<TDataResponse>>,
  ): Promise<TDataResponse> => {
    try {
      const response = await responsePromise;
      if (handleResponse) {
        return await handleResponse(response);
      }
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (handleError) {
        const customError = handleError(axiosError);
        throw customError ?? axiosError;
      }
      throw axiosError;
    }
  };

  const get = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    params?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    const newConfig = {
      ...(config || {}),
      params,
    };
    return executeApi<TDataResponse>(instanceApi.get(endPoint, newConfig));
  };

  const post = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    body?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(
      instanceApi.post(endPoint, body, config as AxiosRequestConfig),
    );
  };

  const put = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    body?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(instanceApi.put(endPoint, body, config as AxiosRequestConfig));
  };

  const patch = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    body?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(
      instanceApi.patch(endPoint, body, config as AxiosRequestConfig),
    );
  };

  const deleteMethod = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    config?: IRequestConfig<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(instanceApi.delete(endPoint, config as AxiosRequestConfig));
  };

  const postForm = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    body?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(
      instanceApi.postForm(endPoint, body, config as AxiosRequestConfig),
    );
  };

  const putForm = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    body?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(
      instanceApi.putForm(endPoint, body, config as AxiosRequestConfig),
    );
  };

  const patchForm = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    body?: TDataRequest,
    config?: IRequestConfigParams<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(
      instanceApi.patchForm(endPoint, body, config as AxiosRequestConfig),
    );
  };

  const request = <TDataResponse = any, TDataRequest = any>(
    config: IRequestConfig<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(instanceApi.request(config as AxiosRequestConfig));
  };

  const head = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    config?: IRequestConfig<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(instanceApi.head(endPoint, config as AxiosRequestConfig));
  };

  const options = <TDataResponse = any, TDataRequest = any>(
    endPoint: string,
    config?: IRequestConfig<TDataRequest>,
  ) => {
    return executeApi<TDataResponse>(instanceApi.options(endPoint, config as AxiosRequestConfig));
  };

  const getUri = (config?: AxiosRequestConfig) => instanceApi.getUri(config);

  return {
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
    postForm,
    putForm,
    patchForm,
    getUri,
    request,
    head,
    options,
  };
};

export const createHttpClient = (baseConfig?: IHttpClientConfig) => HttpClient(baseConfig);
