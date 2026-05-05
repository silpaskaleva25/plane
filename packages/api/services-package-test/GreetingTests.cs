using NUnit.Framework;

namespace Starter.Platform.Services.Tests
{
  [TestFixture]
  public class GreetingTests
  {
    [TestCase("John", "Hello, John!", TestName = "SayHello_WithValidName_ReturnsGreeting")]
    [TestCase("Alice", "Hello, Alice!", TestName = "SayHello_WithAnotherName_ReturnsGreeting")]
    [TestCase("", "Hello, World!", TestName = "SayHello_WithEmptyString_ReturnsDefaultGreeting")]
    [TestCase(null, "Hello, World!", TestName = "SayHello_WithNull_ReturnsDefaultGreeting")]
    public void SayHello_VariousInputs_ReturnsExpectedGreeting(string? name, string expected)
    {
      // Act
      var result = Greeting.SayHello(name);

      // Assert
      Assert.That(result, Is.EqualTo(expected));
    }
  }
}


