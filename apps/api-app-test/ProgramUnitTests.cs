using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using NUnit.Framework;
using StarterApp.Api.Services;
using Starter.Platform.Services;
using Microsoft.AspNetCore.Mvc.ApiExplorer;

namespace StarterApp.Api.Tests
{
  /// <summary>
  /// Unit tests for Program class and application configuration
  /// </summary>
  [TestFixture]
  public class ProgramUnitTests
  {
    [Test]
    public void AddServices_RegistersStarterPlatformServices()
    {
      var services = new ServiceCollection();

      Program.AddServices(services);

      // check one service from Starter Platform Services
      var descriptor = services.FirstOrDefault(s => s.ServiceType == typeof(IApiDescriptionGroupCollectionProvider));
      Assert.That(descriptor, Is.Not.Null, "IApiDescriptionGroupCollectionProvider should be registered");
    }

    [Test]
    public void AddServices_RegistersLibraryServices()
    {
      var services = new ServiceCollection();

      Program.AddServices(services);

      // check one service from the library
      var descriptor = services.FirstOrDefault(s => s.ServiceType == typeof(IGreetingService));
      Assert.That(descriptor, Is.Not.Null, "IGreetingService should be registered");
    }

    [Test]
    public void AddMiddleware_AddsStarterPlatformMiddleware()
    {
      var builder = WebApplication.CreateBuilder();
      var app = builder.Build();

      Program.AddMiddleware(app);

      // Since middleware does not expose a direct way to verify, we check for a known property
      var appBuilder = (IApplicationBuilder)app;
      Assert.That(appBuilder.Properties.ContainsKey(ApplicationBuilderExtensionKeys.MiddlewareAdded), Is.True, "Starter Platform middleware should be added to the application");
      Assert.That(appBuilder.Properties[ApplicationBuilderExtensionKeys.MiddlewareAdded], Is.True, "Starter Platform middleware property should be set to true");
    }

    [Test]
    public void AddMiddleware_AddsAPIMiddleware()
    {
      var builder = WebApplication.CreateBuilder();
      var app = builder.Build();

      Program.AddMiddleware(app);

      var appBuilder = (IApplicationBuilder)app;
      Assert.That(appBuilder.Properties.ContainsKey(WebApplicationExtensionKeys.MiddlewareAdded), Is.True, "API middleware should be added to the application");
      Assert.That(appBuilder.Properties[WebApplicationExtensionKeys.MiddlewareAdded], Is.True, "API middleware property should be set to true");
    }

    [Test]
    public void MapEndpoints_MapsStarterPlatformEndpoints()
    {
      var builder = WebApplication.CreateBuilder();
      Program.AddServices(builder.Services);
      var app = builder.Build();

      Program.MapEndpoints(app);

      var appBuilder = (IApplicationBuilder)app;
      Assert.That(appBuilder.Properties.ContainsKey(ApplicationBuilderExtensionKeys.EndpointsMapped), Is.True, "Starter Platform endpoints should be mapped in the application");
      Assert.That(appBuilder.Properties[ApplicationBuilderExtensionKeys.EndpointsMapped], Is.True, "Starter Platform endpoints mapped property should be set to true");
    }

    [Test]
    public void MapEndpoints_MapsAPIEndpoints()
    {
      var builder = WebApplication.CreateBuilder();
      Program.AddServices(builder.Services);
      var app = builder.Build();

      Program.MapEndpoints(app);

      var appBuilder = (IApplicationBuilder)app;
      Assert.That(appBuilder.Properties.ContainsKey(WebApplicationExtensionKeys.EndpointsMapped), Is.True, "API endpoints should be mapped in the application");
      Assert.That(appBuilder.Properties[WebApplicationExtensionKeys.EndpointsMapped], Is.True, "API endpoints mapped property should be set to true");
    }
  }
}



