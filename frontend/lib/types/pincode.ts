/** `POST /v1/pincode/check` normalized response. */

export type PincodeCheckPayload = {
  serviceable: boolean;
  codAvailable: boolean;
  etaDays: number;
  reason?: "SITE_RESTRICTED" | "SERVICE_AREA" | "PRODUCT_RESTRICTED" | "COD_NOT_OFFERED";
};
