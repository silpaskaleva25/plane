using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;

namespace StarterApp.Api.Tests
{
  [TestFixture]
  public class ProgramIntegrationTests
  {
    private WebApplicationFactory<Program>? _factory;
    private HttpClient? _client;

    [SetUp]
    public void SetUp()
    {
      _factory = new WebApplicationFactory<Program>()
        .WithWebHostBuilder(builder => builder.UseEnvironment(Environments.Development));
      _client = _factory.CreateClient();
    }

    [TearDown]
    public void TearDown()
    {
      _client?.Dispose();
      _factory?.Dispose();
    }

    [Test]
    public async Task Program_ConfiguresGreetingEndpoint()
    {
      // Note: This test proves that MapStarterAppApiEndpoints() was called
      // and the greeting endpoint is configured in the API.
      var response = await _client!.GetAsync("/greeting");
      var content = await response.Content.ReadAsStringAsync();

      Assert.Multiple(() =>
      {
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(content, Is.Not.Null.And.Not.Empty);
      });
    }

    [Test]
    public async Task Program_ConfiguresMapStarterPlatformEndpoints()
    {
      // Note: This test proves that MapStarterPlatformEndpoints() was called
      // and a Hello endpoint is configured in the API for testing purposes.

      var name = "John";
      var response = await _client!.GetAsync($"/api/services/hello/{name}");
      Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
  }
}


