import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=error.middleware.d.ts.map