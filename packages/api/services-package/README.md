# StarterPlatform.Services

API Services utility library for the Starter Platform containing helper methods and common functionality for API development.

## Features

- **Greeting Service**: Simple greeting functionality
- **API Extension Methods**: Extension methods for configuring Starter Platform API endpoints

### Basic Greeting Functionality

```csharp
using Starter.Platform.Services;

// Basic greeting
string greeting = Greeting.SayHello("John");
// Returns: "Hello, John!"

// Null-safe greeting
string defaultGreeting = Greeting.SayHello(null);
// Returns: "Hello, World!"
```

### API Endpoint Extensions

```csharp
using Starter.Platform.Services;

// In your Program.cs or API configuration
var app = builder.Build();

// Map Starter Platform endpoints
app.MapStarterPlatformEndpoints();

// This adds:
// GET /api/services/hello/{name} - Returns greeting with timestamp
```

### Example API Response

```json
{
  "message": "Hello, John!",
  "timestamp": "2025-12-05T10:30:00.000Z"
}
```

## Installation

Install the package via NuGet Package Manager:

```
Install-Package StarterPlatform.Services
```

Or via .NET CLI:

```
dotnet add package StarterPlatform.Services
```


