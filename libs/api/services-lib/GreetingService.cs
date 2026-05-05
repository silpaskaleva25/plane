namespace StarterApp.Api.Services;

/// <summary>
/// Service that provides greeting messages.
/// </summary>
public class GreetingService : IGreetingService
{
  /// <inheritdoc />
  public string GetGreeting()
  {
    return "Hello from Starter App!";
  }
}

