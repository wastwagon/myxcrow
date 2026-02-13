import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred. Please try again later.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const obj = exceptionResponse as Record<string, unknown>;
        message = (obj.message as string | string[]) ?? message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      if (!isProduction) {
        message = exception.message;
      }
    }

    const body: Record<string, unknown> = {
      statusCode: status,
      message: Array.isArray(message) ? message.join('; ') : message,
      error: this.getErrorName(status),
    };

    if (!isProduction && exception instanceof Error && exception.stack) {
      body.stack = exception.stack;
    }

    response.status(status).json(body);
  }

  private getErrorName(status: number): string {
    const names: Record<number, string> = {
        [HttpStatus.BAD_REQUEST]: 'Bad Request',
        [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
        [HttpStatus.FORBIDDEN]: 'Forbidden',
        [HttpStatus.NOT_FOUND]: 'Not Found',
        [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
        [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      };
    return names[status] ?? 'Error';
  }
}
