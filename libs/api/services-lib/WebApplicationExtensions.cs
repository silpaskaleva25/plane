using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace StarterApp.Api.Services;

/// <summary>
/// Keys for ApplicationBuilderExtensions properties
/// </summary>
public static class WebApplicationExtensionKeys
{
  /// <summary>
  /// Set when all API middleware has been added
  /// </summary>
  public const string MiddlewareAdded = "APIMiddlewareAdded";

  /// <summary>
  /// Set when all API endpoints have been mapped
  /// </summary>
  public const string EndpointsMapped = "APIEndpointsMapped";
}

/// <summary>
/// Extension methods for WebApplication.
/// </summary>
public static class WebApplicationExtensions
{
  /// <summary>
  /// Adds Starter App API middleware to the application pipeline.
  /// </summary>
  /// <param name="app">The web application.</param>
  /// <returns>The web application for chaining.</returns>
  public static IApplicationBuilder AddMiddleware(this IApplicationBuilder app)
  {
    // Add any required middleware here

    app.Properties[WebApplicationExtensionKeys.MiddlewareAdded] = true;

    return app;
  }

  /// <summary>
  /// Maps Starter App API endpoints.
  /// </summary>
  /// <param name="app">The web application.</param>
  /// <returns>The web application for chaining.</returns>
  public static T MapEndpoints<T>(this T app) where T : IApplicationBuilder, IEndpointRouteBuilder
  {
    app.MapGet("/greeting", (IGreetingService greetingService) =>
    {
      return Results.Ok(greetingService.GetGreeting());
    });

    app.Properties[WebApplicationExtensionKeys.EndpointsMapped] = true;

    return app;
  }
}

