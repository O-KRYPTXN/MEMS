/**
 * Generic validation middleware using Zod.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - The request property to validate ('body', 'query', 'params'). Defaults to 'body'.
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((err) => err.message).join(', ');
      return res.status(400).json({ message: errorMessages });
    }
    
    // Replace the request property with the parsed (and potentially transformed/type-coerced) data
    req[source] = parsed.data;
    next();
  };
};
