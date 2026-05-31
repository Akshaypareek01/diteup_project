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
        const parsed = schemas.query.parse(req.query) as ZodInfer<TQuery>;
        // Express 5: `req.query` is a getter-only property; replace it for downstream handlers.
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params) as ZodInfer<TParams>;
        Object.defineProperty(req, "params", {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
