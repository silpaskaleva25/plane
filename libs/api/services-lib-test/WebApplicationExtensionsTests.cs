using StarterApp.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace StarterApp.Services.Test;

[TestFixture]
public class WebApplicationExtensionsTests
{
  [Test]
  public void AddMiddleware_ReturnsWebApplication()
  {
    // Arrange
    var builder = WebApplication.CreateBuilder();
    var app = builder.Build();

    // Act
    var result = app.AddMiddleware();

    // Assert
    Assert.That(result, Is.SameAs(app));
  }

  [Test]
  public void MapEndpoints_ReturnsWebApplication()
  {
    // Arrange
    var builder = WebApplication.CreateBuilder();
    builder.Services.AddServices();
    var app = builder.Build();

    // Act
    var result = app.MapEndpoints();

    // Assert
    Assert.That(result, Is.SameAs(app));
  }
}


