import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const resp =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Log the original exception for debugging (visible in server logs)
    // Keep concise output in HTTP response but surface helpful message when available.
    // eslint-disable-next-line no-console
    console.error(
      'Unhandled exception caught by AllExceptionsFilter:',
      exception,
    );

    let message: any = 'Internal server error';
    if (resp && typeof resp === 'object' && (resp as any).message) {
      message = (resp as any).message;
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    } else if (resp) {
      message = resp;
    }

    res.status(status).json({
      success: false,
      message,
      data: null,
    });
  }
}
