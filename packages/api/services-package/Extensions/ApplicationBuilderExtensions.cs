using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Http;

namespace Starter.Platform.Services
{
  /// <summary>
  /// Keys for ApplicationBuilderExtensions properties
  /// </summary>
  public static class ApplicationBuilderExtensionKeys
  {
    /// <summary>
    /// Set when all Starter Platform middleware has been added
    /// </summary>
    public const string MiddlewareAdded = "StarterPlatformMiddlewareAdded";

    /// <summary>
    /// Set when Swagger middleware has been added
    /// </summary>
    public const string SwaggerMiddlewareAdded = "SwaggerMiddlewareAdded";

    /// <summary>
    /// Set when Swagger UI middleware has been added
    /// </summary>
    public const string SwaggerUIMiddlewareAdded = "SwaggerUIMiddlewareAdded";

    /// <summary>
    /// Set when all Starter Platform endpoints have been mapped
    /// </summary>
    public const string EndpointsMapped = "StarterPlatformEndpointsMapped";

    /// <summary>
    /// Set when Health Check endpoints have been mapped
    /// </summary>
    public const string HealthCheckEndpointsMapped = "HealthCheckEndpointsMapped";

    /// <summary>
    /// Set when Greeting endpoints have been mapped
    /// </summary>
    public const string GreetingEndpointsMapped = "GreetingEndpointsMapped";
  }

  /// <summary>
  /// Extension methods for configuring Starter Platform services
  /// </summary>
  public static class ApplicationBuilderExtensions
  {
    #region Middleware
    /// <summary>
    /// Configure Starter Platform middleware
    /// </summary>
    public static IApplicationBuilder AddStarterPlatformMiddleware(this IApplicationBuilder app, string apiTitle, string[] versions)
    {
      app
        .UseSwagger(apiTitle, versions)
        .UseSwaggerUI(apiTitle, versions);

      app.Properties[ApplicationBuilderExtensionKeys.MiddlewareAdded] = true;

      return app;
    }

    // prettier-ignore
    private static IApplicationBuilder UseSwagger(this IApplicationBuilder app, string apiTitle, string[] versions) // NOSONAR csharpsquid:S1172 - some params are unused - WIP
    {
      // prettier-ignore
      // app.UseSwagger(); // NOSONAR csharpsquid:S125 - suggested code - WIP

      app.Properties[ApplicationBuilderExtensionKeys.SwaggerMiddlewareAdded] = true;

      return app;
    }

    // prettier-ignore
    private static IApplicationBuilder UseSwaggerUI(this IApplicationBuilder app, string apiTitle, string[] versions) // NOSONAR csharpsquid:S1172 - some params are unused - WIP
    {
      // prettier-ignore
      // app.UseSwaggerUI(); // NOSONAR csharpsquid:S125 - suggested code - WIP

      app.Properties[ApplicationBuilderExtensionKeys.SwaggerUIMiddlewareAdded] = true;

      return app;
    }

    #endregion

    #region Endpoints

    /// <summary>
    /// Maps all Starter Platform endpoints
    /// </summary>
    public static T MapStarterPlatformEndpoints<T>(this T app, string[] versions) where T : IApplicationBuilder, IEndpointRouteBuilder
    {
      // NewApiVersionSet
      // build ApiVersionSet

      // Map Starter Platform endpoints 
      app
        .MapHealthCheckEndpoints(versions)
        .MapGreetingEndpoints(versions);

      app.Properties[ApplicationBuilderExtensionKeys.EndpointsMapped] = true;


      return app;
    }

    // prettier-ignore
    private static T MapHealthCheckEndpoints<T>(this T app, string[] versions) where T : IApplicationBuilder, IEndpointRouteBuilder // NOSONAR csharpsquid:S1172 - some params are unused - WIP
    {
      // More code needs to be implemented here

      app.Properties[ApplicationBuilderExtensionKeys.HealthCheckEndpointsMapped] = true;

      return app;
    }

    // prettier-ignore
    private static T MapGreetingEndpoints<T>(this T app, string[] versions) where T : IApplicationBuilder, IEndpointRouteBuilder // NOSONAR csharpsquid:S1172 - some params are unused - WIP
    {
      app.MapGet("/api/services/hello/{name}", (string name) =>
      {
        var greeting = Greeting.SayHello(name);
        return Results.Ok(new { message = greeting, timestamp = DateTime.UtcNow });
      })
      .WithOpenApi();

      app.Properties[ApplicationBuilderExtensionKeys.GreetingEndpointsMapped] = true;

      return app;
    }

    #endregion
  }
}


