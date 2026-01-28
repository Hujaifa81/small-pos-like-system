/* eslint-disable prettier/prettier */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((payload) => {
        const isObject = payload && typeof payload === 'object';

        const data = isObject
          ? (payload.data ?? payload.items ?? payload)
          : payload;

        const message = isObject ? (payload.message ?? 'Success') : 'Success';

        const meta = isObject
          ? (payload.meta ?? (payload.data && payload.data.meta))
          : undefined;

        const success =
          isObject && Object.prototype.hasOwnProperty.call(payload, 'success')
            ? payload.success
            : true;

        const result: any = {
          success,
          message,
          data,
        };

        if (meta !== undefined) result.meta = meta;

        return result;
      }),
    );
  }
}
