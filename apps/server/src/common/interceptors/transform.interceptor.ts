import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map(
        (data: T): Response<T> => {
          // 如果返回的数据已经包含 success 字段，保留它
          if (data && typeof data === 'object' && 'success' in data) {
            return {
              ...data,
              timestamp: new Date().toISOString(),
            } as any;
          }
          // 否则按原样包装
          return {
            data,
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );
  }
}
