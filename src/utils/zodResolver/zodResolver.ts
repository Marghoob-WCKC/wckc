import { ZodType } from "zod";

export function zodResolver(schema: ZodType<any, any, any>) {
  return (values: any) => {
    const parsed = schema.safeParse(values);

    if (parsed.success) return {};

    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      console.log("Zod issue:", issue);
      const field = issue.path[0];
      if (typeof field === "string") {
        errors[field] = issue.message;
      }
    }

    return errors;
  };
}
