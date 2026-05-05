using StarterApp.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using System.Net;

namespace StarterApp.Services.Test;

[TestFixture]
public class WebApplicationExtensionsIntegrationTests
{
  [Test]
  public async Task MapEndpoints_GreetingEndpoint_ReturnsOk()
  {
    // Arrange
    var builder = WebApplication.CreateBuilder();
    builder.Services.AddServices();
    builder.WebHost.UseTestServer();
    var app = builder.Build();
    app.MapEndpoints();
    await app.StartAsync();

    var client = app.GetTestClient();

    // Act
    var response = await client.GetAsync("/greeting");
    var content = await response.Content.ReadAsStringAsync();

    // Assert
    Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    Assert.That(content, Is.Not.Null.And.Not.Empty);
  }

  [TestCase("/nonexistent", TestName = "MapEndpoints_NonExistentEndpoint_ReturnsNotFound")]
  [TestCase("/greetings", TestName = "MapEndpoints_SimilarEndpoint_ReturnsNotFound")]
  public async Task MapEndpoints_InvalidEndpoint_ReturnsNotFound(string endpoint)
  {
    // Arrange
    var builder = WebApplication.CreateBuilder();
    builder.Services.AddServices();
    builder.WebHost.UseTestServer();
    var app = builder.Build();
    app.MapEndpoints();
    await app.StartAsync();

    var client = app.GetTestClient();

    // Act
    var response = await client.GetAsync(endpoint);

    // Assert
    Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
  }

  [TestCase("POST", TestName = "MapEndpoints_GreetingEndpoint_PostReturnsMethodNotAllowed")]
  [TestCase("PUT", TestName = "MapEndpoints_GreetingEndpoint_PutReturnsMethodNotAllowed")]
  [TestCase("DELETE", TestName = "MapEndpoints_GreetingEndpoint_DeleteReturnsMethodNotAllowed")]
  public async Task MapEndpoints_GreetingEndpoint_InvalidMethod_ReturnsMethodNotAllowed(string method)
  {
    // Arrange
    var builder = WebApplication.CreateBuilder();
    builder.Services.AddServices();
    builder.WebHost.UseTestServer();
    var app = builder.Build();
    app.MapEndpoints();
    await app.StartAsync();

    var client = app.GetTestClient();
    var request = new HttpRequestMessage(new HttpMethod(method), "/greeting");

    // Act
    var response = await client.SendAsync(request);

    // Assert
    Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
  }
}

