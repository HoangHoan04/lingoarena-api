import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { ApiException, ValidateException } from './dto';

require('dotenv').config();

interface AppError {
  message: string;
  status: number;
  details?: any;
  type?: string;
}

const normalizeText = (value: unknown): string => {
  if (typeof value !== 'string') return '';

  return value.trim().replace(/\s+/g, ' ');
};

const translateMessage = (i18n: I18nService, message: string) => {
  try {
    return i18n.translate(message);
  } catch {
    return message;
  }
};

const pipeException = (
  {
    apiException,
    type,
  }: {
    apiException: ApiException;
    type?: 'ValidateException';
  },
  i18n: I18nService,
) => {
  const message = normalizeText(apiException.message);

  const errors =
    type === 'ValidateException'
      ? Object.fromEntries(
          Object.entries(apiException.errors || {}).map(([key, value]) => [
            key,
            typeof value === 'string' ? normalizeText(value) : value,
          ]),
        )
      : apiException.errors;

  return {
    ...apiException,
    ...(type === 'ValidateException' ? { errors } : {}),
    message: translateMessage(i18n, message),
  };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private i18n: I18nService) {}
  catch(exception: HttpException | ValidateException | any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = this.normalizeException(exception);

    const isBot = this.checkBotRequest(request);
    const isBotNotFound = isBot && error.status === HttpStatus.NOT_FOUND;

    const isWriteLog = !isBotNotFound;

    if (isWriteLog) {
      console.log('--------HttpExceptionFilter-----------');
      console.log(exception);
      console.log('-------------------');
    }

    this.sendResponse(response, error);

    if (isWriteLog) {
      this.logError(request, error, exception);
    }
  }

  private checkBotRequest(request: Request) {
    const userAgent = (request?.headers?.['user-agent'] || '').toLowerCase();
    const isBot =
      userAgent.includes('bot') ||
      userAgent.includes('crawl') ||
      userAgent.includes('spider') ||
      userAgent.includes('slurp') ||
      userAgent.includes('crawler');
    return isBot;
  }

  private normalizeException(exception: unknown): AppError {
    if (exception instanceof ApiException) {
      return {
        message: exception.message,
        status: exception.httpCode,
        details: exception.errors,
        type: 'ApiException',
      };
    }

    if (exception instanceof ValidateException) {
      return {
        message: exception.message?.trim() || 'Value not right',
        status: HttpStatus.BAD_REQUEST,
        details: exception.messages,
        type: 'ValidateException',
      };
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        message: 'Data not found',
        status: HttpStatus.NOT_FOUND,
        details: exception.message,
        type: 'EntityNotFoundError',
      };
    }

    if (exception instanceof QueryFailedError) {
      const driverError: any = exception.driverError;

      switch (driverError?.code) {
        case 'ER_DUP_ENTRY':
          return {
            message: 'Data already exists',
            status: HttpStatus.CONFLICT,
            details: driverError,
            type: 'DuplicateEntry',
          };

        case 'ER_NO_REFERENCED_ROW_2':
          return {
            message: 'Referenced data does not exist',
            status: HttpStatus.BAD_REQUEST,
            details: driverError,
            type: 'ForeignKeyNotFound',
          };

        case 'ER_ROW_IS_REFERENCED_2':
          return {
            message: 'Cannot delete because data is being used',
            status: HttpStatus.CONFLICT,
            details: driverError,
            type: 'ForeignKeyConstraint',
          };

        default:
          return {
            message: 'Database error',
            status: HttpStatus.BAD_REQUEST,
            details: driverError,
            type: 'QueryFailedError',
          };
      }
    }

    if (axios.isAxiosError(exception)) {
      const axiosError = exception as AxiosError;

      return {
        message: axiosError.message,
        status: axiosError.response?.status || HttpStatus.BAD_GATEWAY,
        details: {
          code: axiosError.code,
          response: axiosError.response?.data,
        },
        type: 'AxiosError',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return {
          message: res,
          status,
          type: exception.name,
        };
      }

      const response: any = res;

      return {
        message: Array.isArray(response?.message)
          ? response.message.join(',')
          : response?.message || exception.message || 'Server Error',
        status,
        details: response,
        type: exception.name,
      };
    }

    if (exception instanceof Error) {
      return {
        message: exception.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        details: {
          stack: exception.stack,
          cause: (exception as any).cause,
        },
        type: exception.name,
      };
    }

    if (typeof exception === 'string') {
      return {
        message: exception,
        status: HttpStatus.BAD_REQUEST,
        type: 'StringException',
      };
    }

    if (typeof exception === 'object' && exception !== null) {
      const ex: any = exception;

      return {
        message: ex.message || 'Unknown Error',
        status: ex.status || ex.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        details: ex,
        type: ex.name || 'UnknownException',
      };
    }

    return {
      message: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      details: exception,
      type: 'UnknownException',
    };
  }

  private sendResponse(response: Response, error: AppError) {
    response.status(error.status).send(
      pipeException(
        {
          apiException: new ApiException(error.message, error.status, error.details),
        },
        this.i18n,
      ),
    );
  }

  private logError(request: Request, error: AppError, exception: unknown) {
    if (request?.body?.password) {
      request.body.password = '***';
    }
    this.processLogBugApi({
      request,
      exception,
      message: error.message,
      status: error.status,
      name: error.type || 'UNKNOWN',
    });
  }

  private async processLogBugApi({ request, exception, message, status, name }) {
    try {
      if (process.env.ENVIRONMENT === 'DEVELOP') return true;
      if (status == HttpStatus.UNAUTHORIZED && message == 'Unauthorized') return true;
      if (exception?.code === 'ECONNABORTED') return true;

      const jsonRequest = {
        body: request.body,
        header: request.headers,
        ip: request.ip,
        user: request.user,
      };
      const obj = {
        project: process.env.PROJECT_NAME,
        source: process.env.SOURCE_CODE,
        environments: process.env.ENVIRONMENT,
        error: exception,
        request: jsonRequest,
        message: message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        name: name,
      };

      const url = process.env.LOG_URL;
      try {
        await axios.post(url, obj);
      } catch (error) {}
    } catch (_error) {}
  }
}
