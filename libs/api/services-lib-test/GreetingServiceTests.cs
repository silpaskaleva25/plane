using StarterApp.Api.Services;
using NUnit.Framework;

namespace StarterApp.Services.Test;

[TestFixture]
public class GreetingServiceTests
{
  private IGreetingService _greetingService = null!;

  [SetUp]
  public void SetUp()
  {
    _greetingService = new GreetingService();
  }

  [Test]
  public void GetGreeting_ReturnsExpectedMessage()
  {
    // Act
    var result = _greetingService.GetGreeting();

    // Assert
    Assert.That(result, Is.Not.Null);
    Assert.That(result, Is.Not.Empty);
    Assert.That(result, Is.EqualTo("Hello from Starter App!"));
  }
}

