namespace StarterApp.Api.Services;

/// <summary>
/// Interface for the greeting service.
/// </summary>
public interface IGreetingService
{
  /// <summary>
  /// Gets a greeting message.
  /// </summary>
  /// <returns>A greeting string.</returns>
  string GetGreeting();
}

