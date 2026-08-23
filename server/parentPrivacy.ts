import { TRPCError } from "@trpc/server";

/**
 * Keeps the export permission decision on the server, independent of whether
 * the client happens to hide or disable its export control.
 */
export function assertChildDataExportAllowed(dataExportAllowed: boolean) {
  if (!dataExportAllowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "parent.exportDisabled" });
  }
}
