import { Model, Document, FilterQuery } from 'mongoose';
export interface CursorPaginationOptions {
    limit?: number;
    cursor?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: FilterQuery<any>;
}
export interface CursorPaginationResult<T> {
    items: T[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalCount?: number;
    pageInfo: {
        startCursor: string | null;
        endCursor: string | null;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}
export interface CursorInfo {
    id: string;
    sortValue: any;
    direction: 'forward' | 'backward';
}
export declare class CursorPagination {
    static paginate<T extends Document>(model: Model<T>, options?: CursorPaginationOptions): Promise<CursorPaginationResult<T>>;
    static paginateWithCount<T extends Document>(model: Model<T>, options?: CursorPaginationOptions): Promise<CursorPaginationResult<T>>;
    private static generateCursor;
    private static parseCursor;
    private static applyCursorFilter;
    static createPaginatedResponse<T>(result: CursorPaginationResult<T>, baseUrl: string, queryParams?: Record<string, any>): {
        data: T[];
        pagination: {
            pageInfo: {
                startCursor: string | null;
                endCursor: string | null;
                hasNextPage: boolean;
                hasPrevPage: boolean;
            };
            totalCount: number;
            cursors: {
                next: string;
                prev: string;
            };
            links: {
                next: string;
                prev: string;
            };
        };
    };
}
export declare const cursorPaginationMiddleware: (req: any, res: any, next: any) => void;
export declare const convertSkipLimitToCursor: (page: number, limit: number, sortField?: string) => {
    limit: number;
    skip?: number;
};
export default CursorPagination;
//# sourceMappingURL=cursorPagination.d.ts.map