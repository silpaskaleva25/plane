using StarterApp.Api.Services;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace StarterApp.Services.Test;

[TestFixture]
public class ServiceCollectionExtensionsTests
{
  [Test]
  public void AddServices_RegistersGreetingService()
  {
    // Arrange
    var services = new ServiceCollection();

    // Act
    services.AddServices();
    var serviceProvider = services.BuildServiceProvider();
    var greetingService = serviceProvider.GetService<IGreetingService>();

    // Assert
    Assert.That(greetingService, Is.Not.Null);
    Assert.That(greetingService, Is.TypeOf<GreetingService>());
  }

  [Test]
  public void AddServices_ReturnsServiceCollection()
  {
    // Arrange
    var services = new ServiceCollection();

    // Act
    var result = services.AddServices();

    // Assert
    Assert.That(result, Is.SameAs(services));
  }
}

