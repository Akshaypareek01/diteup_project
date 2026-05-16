/**
 * Admin HTTP — users + product catalog (Phase 8.4, 8.5).
 */
import type { Request, Response, NextFunction } from "express";

import * as adminProducts from "../services/adminProducts.js";
import * as adminUsers from "../services/adminUsers.js";
import { Unauthorized } from "../utils/errors.js";
import type {
  AdminProductListQueryInput,
  AdminUserListQueryInput,
} from "../validators/adminExpanded.js";

/**
 * GET /v1/admin/users
 */
export async function getAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminUserListQueryInput;
    const data = await adminUsers.listUsersAdmin({
      page: q.page,
      pageSize: q.pageSize,
      role: q.role,
      isActive: q.isActive,
      q: q.q,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/users/export
 */
export async function getAdminUsersExport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminUserListQueryInput;
    const buf = await adminUsers.exportUsersXlsx({
      page: 1,
      pageSize: 5000,
      role: q.role,
      isActive: q.isActive,
      q: q.q,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="users.xlsx"');
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/users/:id
 */
export async function getAdminUserById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminUsers.getUserAdmin(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /v1/admin/users/:id
 */
export async function patchAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminUsers.updateUserAdmin({
      userId: String(req.params.id),
      actorId: req.auth.userId,
      restrictions: req.body.restrictions,
      tags: req.body.tags,
      adminNotes: req.body.adminNotes,
      isActive: req.body.isActive,
      deactivationReason: req.body.deactivationReason,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/users/:id/force-logout
 */
export async function postAdminUserForceLogout(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminUsers.forceLogoutUserAdmin({
      userId: String(req.params.id),
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/users/:id/anonymize
 */
export async function postAdminUserAnonymize(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminUsers.anonymizeUserAdmin({
      userId: String(req.params.id),
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/products
 */
export async function getAdminProducts(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminProductListQueryInput;
    const data = await adminProducts.listProductsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      visibility: q.visibility,
      q: q.q,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/products
 */
export async function postAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminProducts.createProductAdmin({
      slug: req.body.slug,
      name: req.body.name,
      description: req.body.description,
      sku: req.body.sku,
      variantName: req.body.variantName,
      priceMrp: req.body.priceMrp,
      priceSale: req.body.priceSale,
      visibility: req.body.visibility,
      actorId: req.auth.userId,
      req,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/products/:id
 */
export async function getAdminProductById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminProducts.getProductAdmin(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /v1/admin/products/:id
 */
export async function patchAdminProduct(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminProducts.updateProductAdmin({
      productId: String(req.params.id),
      actorId: req.auth.userId,
      data: req.body,
      req,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/products/:id/archive
 */
export async function postAdminProductArchive(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminProducts.archiveProductAdmin({
      productId: String(req.params.id),
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/products/bulk-visibility
 */
export async function postAdminProductsBulkVisibility(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await adminProducts.bulkSetProductVisibilityAdmin({
      productIds: req.body.productIds,
      visibility: req.body.visibility,
      actorId: req.auth.userId,
      req,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/products/:id/variants
 */
export async function postAdminProductVariant(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminProducts.upsertVariantAdmin({
      productId: String(req.params.id),
      variantId: req.body.variantId,
      sku: req.body.sku,
      name: req.body.name,
      priceMrp: req.body.priceMrp,
      priceSale: req.body.priceSale,
      weightGm: req.body.weightGm,
      isDefault: req.body.isDefault,
      isActive: req.body.isActive,
      actorId: req.auth.userId,
      req,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/products/:id/media
 */
export async function postAdminProductMedia(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminProducts.addProductMediaAdmin({
      productId: String(req.params.id),
      type: req.body.type,
      url: req.body.url,
      altText: req.body.altText,
      order: req.body.order,
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /v1/admin/products/media/:mediaId
 */
export async function deleteAdminProductMedia(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminProducts.deleteProductMediaAdmin({
      mediaId: String(req.params.mediaId),
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
