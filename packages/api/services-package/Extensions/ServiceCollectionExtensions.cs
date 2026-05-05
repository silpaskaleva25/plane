using Microsoft.Extensions.DependencyInjection;
using Asp.Versioning;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Starter.Platform.Services
{
  /// <summary>
  /// Extension methods for configuring Starter Platform services
  /// </summary>
  public static class ServiceCollectionExtensions
  {
    #region Add Services

    /// <summary>
    /// Configure Starter Platform services
    /// </summary>
    public static IServiceCollection AddStarterPlatformServices(this IServiceCollection services, string apiTitle, string[] versions)
    {
      AddApiVersioning(services, versions);
      services.AddEndpointsApiExplorer();
      ConfigureHealthChecks(services);
      AddSwagger(services, apiTitle, versions);

      // prettier-ignore
      // services.AddScoped<IGreetingService, GreetingService>(); // NOSONAR csharpsquid:S125 - suggested code - WIP

      return services;
    }

    // prettier-ignore
    private static IServiceCollection AddApiVersioning(this IServiceCollection services, string[] versions) // NOSONAR csharpsquid:S1172 & csharpsquid:S3241 - some params are unused & return value never used yet - WIP
    {
      // More code needs to be implemented here

      return services;
    }

    // prettier-ignore
    private static IServiceCollection ConfigureHealthChecks(this IServiceCollection services) // NOSONAR csharpsquid:S3241 - return value never used yet - WIP
    {
      // More code needs to be implemented here
      services.AddHealthChecks();

      return services;
    }

    // prettier-ignore
    private static IServiceCollection AddSwagger(this IServiceCollection services, string apiTitle, string[] versions) // NOSONAR csharpsquid:S1172 & csharpsquid:S3241 - some params are unused & return value never used yet - WIP
    {
      // More code needs to be implemented here

      return services;
    }

    #endregion
  }
}


