import { ZodError, type ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, req: { body: unknown }): T {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(error.issues[0]?.message ?? "Solicitud no valida.");
    }
    throw error;
  }
}
