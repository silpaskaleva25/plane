using StarterApp.Api.Services.Dtos;

namespace StarterApp.Api.Services;

public class GreetingService : IGreetingService
{
  public GreetingResponseDto GetGreeting()
  {
    return new GreetingResponseDto("Hello from Starter App!");
  }
}

