using Starter.Platform.Configuration;
using Starter.Platform.Services;
using StarterApp.Api.Services;
using Npgsql;

// Application Entry Point
var builder = WebApplication.CreateBuilder(args);

// Configure services
Program.AddServices(builder.Services);

// Build application
var app = builder.Build();

// Configure middleware
Program.AddMiddleware(app);

// Map endpoints
Program.MapEndpoints(app);

// Start the application
await app.RunAsync();

/// <summary>
/// Partial Program class to organize application startup logic.
/// Declared as public partial to complement the compiler-generated class from top-level statements.
/// </summary>
public partial class Program
{
  private const string ApiTitle = "Starter App";

  // Protected constructor to satisfy CA1052 (Static holder types should be Static or NotInheritable)
  protected Program() { }

  /// <summary>
  /// Configures all application services
  /// </summary>
  public static void AddServices(IServiceCollection services)
  {
    // Configure services (from package)
    services.AddStarterPlatformServices(ApiTitle, []);

    // Configure Starter App API services (from library)
    services.AddServices();
  }

  /// <summary>
  /// Configures all application middleware
  /// </summary>
  public static void AddMiddleware(WebApplication app)
  {
    // Add middleware (from package)
    app.AddStarterPlatformMiddleware(
      ApiTitle,
      []
    );

    // Add Starter App API middleware (from library)
    app.AddMiddleware();
  }

  /// <summary>
  /// Maps all application endpoints
  /// </summary>
  public static void MapEndpoints(WebApplication app)
  {
    app.MapHealthChecks("/health");

    app.MapGet("/health/db", async (IConfiguration configuration, CancellationToken cancellationToken) =>
    {
      var connectionString = configuration.GetConnectionString("Postgres");
      if (string.IsNullOrWhiteSpace(connectionString))
      {
        return Results.Problem(
          title: "PostgreSQL is not configured",
          detail: "Connection string 'ConnectionStrings:Postgres' was not found.",
          statusCode: StatusCodes.Status500InternalServerError
        );
      }

      try
      {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new NpgsqlCommand("SELECT 1", connection);
        var result = await command.ExecuteScalarAsync(cancellationToken);

        return Equals(result, 1)
          ? Results.Ok(new { status = "ok", database = "postgres" })
          : Results.Problem(
              title: "Unexpected database response",
              detail: "Connectivity check query did not return the expected value.",
              statusCode: StatusCodes.Status503ServiceUnavailable
            );
      }
      catch
      {
        return Results.Problem(
          title: "PostgreSQL connection failed",
          detail: "Unable to connect using 'ConnectionStrings:Postgres'.",
          statusCode: StatusCodes.Status503ServiceUnavailable
        );
      }
    });

    // Map Starter Platform endpoints (from package)
    app.MapStarterPlatformEndpoints([]);

    // Map Starter App API endpoints (from library)
    app.MapEndpoints();
  }
}


