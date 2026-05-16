/**
 * Generic Zod request-validation middleware factory.
 * Validates req.body / req.query / req.params and replaces them with parsed values.
 */
import type { RequestHandler } from "express";
import type { ZodTypeAny, infer as ZodInfer } from "zod";

type Schemas<TBody extends ZodTypeAny, TQuery extends ZodTypeAny, TParams extends ZodTypeAny> = {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
};

export function validate<
  TBody extends ZodTypeAny,
  TQuery extends ZodTypeAny,
  TParams extends ZodTypeAny
>(schemas: Schemas<TBody, TQuery, TParams>): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as ZodInfer<TBody>;
      }
      if (schemas.query) {
        const q = schemas.query.parse(req.query) as ZodInfer<TQuery>;
        Object.assign(req.query as Record<string, unknown>, q);
      }
      if (schemas.params) {
        const p = schemas.params.parse(req.params) as ZodInfer<TParams>;
        Object.assign(req.params as Record<string, unknown>, p);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
