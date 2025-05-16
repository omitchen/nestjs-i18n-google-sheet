import { createZodDto } from "nestjs-zod/dto";
import { z } from "nestjs-zod/z";

export class MessagesQuery extends createZodDto(
  z.object({
    revalidate: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return false;
        return ["true", "1", "yes"].includes(val.toLowerCase());
      })
      .default("false"),
    sheetName: z
      .string({
        required_error: "sheetName is required",
        invalid_type_error: "sheetName must be a string",
      })
      .min(1, "sheetName cannot be empty"),
    langs: z
      .string()
      .optional()
      .transform((s) => (s ? s.split(",") : undefined)),
    issuer: z
      .string({
        required_error: "issuer is required",
        invalid_type_error: "issuer must be a string",
      })
      .min(1, "issuer cannot be empty"),
  })
) {}

export * from "./interfaces/i18n-module-options.interface";
