import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { devLogger } from '../../utils/logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    // 모든 에러 로그 출력 (디버깅 개선)
    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    devLogger.error('서버 오류 발생:', {
      statusCode: status,
      path: request.url,
      method: request.method,
      body: request.body,
      error: exception instanceof Error ? exception.message : String(exception),
      errorResponse: errorResponse,
      stack:
        exception instanceof Error && process.env.NODE_ENV !== 'production'
          ? exception.stack
          : undefined,
    });

    // ValidationPipe 에러 메시지 포맷 개선
    let errorMessage: string | string[] | object = message;
    if (typeof message === 'object' && message !== null) {
      const msgObj = message as any;
      if (msgObj.message && Array.isArray(msgObj.message)) {
        // ValidationPipe 에러 배열을 문자열로 변환
        errorMessage = msgObj.message;
      } else if (msgObj.message) {
        errorMessage = msgObj.message;
      } else {
        errorMessage = JSON.stringify(msgObj);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}
