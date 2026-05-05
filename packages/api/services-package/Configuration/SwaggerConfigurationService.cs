using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Starter.Platform.Configuration
{
  /// <summary>
  /// Reusable Swagger/OpenAPI configuration service
  /// </summary>
  public static class SwaggerConfigurationService
  {
    /// <summary>
    /// Adds Swagger services
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="apiTitle">The API title for Swagger documentation</param>
    /// <param name="apiVersion">The API version</param>
    public static void AddServices(
      this IServiceCollection services,
      string apiTitle,
      string apiVersion)
    {
      services.AddEndpointsApiExplorer();

      services.AddSwaggerGen(options =>
      {
        options.SwaggerDoc(apiVersion, new Microsoft.OpenApi.Models.OpenApiInfo
        {
          Title = apiTitle,
          Version = apiVersion
        });
      });
    }

    /// <summary>
    /// Adds Swagger middleware
    /// </summary>
    /// <param name="app">The web application</param>
    /// <param name="apiTitle">The API title for Swagger documentation</param>
    /// <param name="apiVersion">The API version</param>
    /// <param name="swaggerCliIndicator">CLI indicator for Swagger tool detection (default: "swagger")</param>
    /// <param name="generateSwaggerKey">Configuration key for enabling Swagger (default: "GenerateSwagger")</param>
    public static void AddMiddleware(
      this WebApplication app,
      string apiTitle,
      string apiVersion,
      string swaggerCliIndicator = "swagger",
      string generateSwaggerKey = "GenerateSwagger")
    {
      if (ShouldEnableSwagger(app, swaggerCliIndicator, generateSwaggerKey))
      {
        app.UseSwagger();
      }

      if (app.Environment.IsDevelopment())
      {
        app.UseSwaggerUI(options =>
        {
          options.SwaggerEndpoint($"/swagger/{apiVersion}/swagger.json", $"{apiTitle} {apiVersion}");
          options.RoutePrefix = string.Empty;
        });
      }
    }

    /// <summary>
    /// Determines if Swagger should be enabled based on environment and configuration
    /// </summary>
    internal static bool ShouldEnableSwagger(WebApplication app, string swaggerCliIndicator, string generateSwaggerKey)
    {
      return app.Environment.IsDevelopment()
        || IsSwaggerCliTool(swaggerCliIndicator)
        || IsGenerateSwaggerEnabled(app, generateSwaggerKey);
    }

    /// <summary>
    /// Checks if the application is being run by the Swagger CLI tool
    /// </summary>
    private static bool IsSwaggerCliTool(string swaggerCliIndicator)
    {
      return Environment.GetCommandLineArgs()
        .Any(arg => arg.Contains(swaggerCliIndicator, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Checks if Swagger generation is explicitly enabled via configuration
    /// </summary>
    private static bool IsGenerateSwaggerEnabled(WebApplication app, string generateSwaggerKey)
    {
      return app.Configuration.GetValue(generateSwaggerKey, false);
    }
  }
}

