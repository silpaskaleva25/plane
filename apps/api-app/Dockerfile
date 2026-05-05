# =============================================================================
# Environment-agnostic Dockerfile for all environments (local, dev, qa, prod)
# Uses pre-built artifacts from dist/publish to ensure consistency
# Runtime environment variables control behavior
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy the pre-built publish output from dist/publish (build context)
# NOSONAR docker:S6470 - Safe recursive copy, build context is pre-filtered publish output, .dockerignore excludes sensitive files
COPY . .

# Run as non-root user for security
USER app

# Set production defaults (can be overridden at runtime with -e flags)
# Use 0.0.0.0 (IPv4) instead of + (defaults to IPv6 in .NET 8)
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

# Expose production port (default, can be overridden at runtime)
EXPOSE 8080

# Set the entry point to run the application
ENTRYPOINT ["dotnet", "StarterApp.Api.dll"]

