type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

export function withErrorHandling<Args extends unknown[]>(
  handler: RouteHandler<Args>,
  errorMessage = "Erreur serveur"
): RouteHandler<Args> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(error);
      return Response.json({ error: errorMessage }, { status: 500 });
    }
  };
}
