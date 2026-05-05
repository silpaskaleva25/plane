using Microsoft.Extensions.DependencyInjection;

namespace StarterApp.Api.Services;

/// <summary>
/// Extension methods for IServiceCollection.
/// </summary>
public static class ServiceCollectionExtensions
{
  /// <summary>
  /// Adds Starter App API services to the service collection.
  /// </summary>
  /// <param name="services">The service collection.</param>
  /// <returns>The service collection for chaining.</returns>
  public static IServiceCollection AddServices(this IServiceCollection services)
  {
    services.AddTransient<IGreetingService, GreetingService>();
    return services;
  }
}

