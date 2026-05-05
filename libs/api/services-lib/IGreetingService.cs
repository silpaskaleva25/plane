using StarterApp.Api.Services.Dtos;

namespace StarterApp.Api.Services;

public interface IGreetingService
{
  GreetingResponseDto GetGreeting();
}

