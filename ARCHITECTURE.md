/\*\*

- ARCHITECTURE.md
-
- Documentation for the Clean Architecture implementation in the Second Brain project
  \*/

# Second Brain - Clean Architecture Implementation

## Architecture Overview

This project follows the Clean Architecture pattern to create a modular, testable, and maintainable system. The architecture is organized into concentric layers, with dependencies pointing inward.

```
┌────────────────────────────────────┐
│ Infrastructure & Frameworks Layer  │
├────────────────────────────────────┤
│ Adapters Layer                     │
├────────────────────────────────────┤
│ Application Layer (Use Cases)      │
├────────────────────────────────────┤
│ Domain Layer                       │
└────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Domain Layer

The core of the application containing business entities, rules, and interfaces.

- **Entities**: Business objects with data and behavior
- **Value Objects**: Immutable objects used within entities
- **Repository Interfaces**: Contracts for data access
- **Port Interfaces**: Contracts for external services
- **Domain Services**: Complex business logic spanning multiple entities

### 2. Application Layer (Use Cases)

Contains application-specific business rules and orchestrates the flow of data to and from entities.

- **Use Cases**: Implement specific business operations
- **DTOs (Data Transfer Objects)**: Data containers for crossing boundaries

### 3. Adapters Layer

Converts data between formats suitable for use cases and external frameworks.

- **Input Adapters**: Convert external requests into a format usable by use cases
- **Output Adapters**: Implement repository interfaces and external service ports
- **Controllers/Presenters**: Format data for delivery to external systems

### 4. Infrastructure & Frameworks Layer

Outermost layer containing frameworks, tools, and delivery mechanisms.

- **Web Framework**: Express/Node.js
- **Database**: PostgreSQL
- **External Services**: Gemini AI
- **Configuration**: Environment variables

## Directory Structure

The project is organized into feature-based folders following the Clean Architecture pattern:

```
src/
  ├── domain/                     # Domain layer
  │   ├── common/                 # Shared domain elements
  │   │   ├── entities/
  │   │   ├── ports/
  │   │   └── repositories/
  │   ├── finance/                # Finance domain
  │   │   ├── dtos/
  │   │   ├── entities/
  │   │   ├── ports/
  │   │   ├── repositories/
  │   │   └── use-cases/
  │   └── transcription/          # Transcription domain
  │       ├── dtos/
  │       ├── entities/
  │       ├── ports/
  │       ├── repositories/
  │       └── use-cases/
  ├── adapters/                   # Adapters layer
  │   ├── input/                  # Input adapters
  │   │   ├── http/               # HTTP controllers
  │   │   └── telegram/           # Telegram bot adapters
  │   └── output/                 # Output adapters
  │       ├── database/           # Database implementations
  │       ├── services/           # External service implementations
  │       └── logging/            # Logging implementations
  ├── cmd/                        # Command layer (app entry points)
  │   ├── container.ts            # Dependency injection container
  │   ├── telegram-bot.ts         # Telegram bot entry point
  │   └── http-server.ts          # HTTP server entry point (future)
  ├── infrastructure/             # Infrastructure configurations
  │   └── database/
  └── bot.ts                      # Main entry point
```

## Dependency Flow

The Clean Architecture enforces a dependency rule: dependencies can only point inward. The inner layers know nothing about the outer layers.

1. Domain layer has no external dependencies
2. Application layer depends only on Domain layer
3. Adapters layer depends on Application and Domain layers
4. Infrastructure layer depends on all inner layers

## Dependency Injection

The system uses dependency injection to:

1. Invert dependencies to follow the Dependency Inversion Principle
2. Make testing easier through mocking
3. Manage the lifecycle of components

All dependencies are wired up in the `container.ts` file.

## Interfaces and Ports

The Clean Architecture uses interfaces to define boundaries between layers:

- **Repository Interfaces**: Define how domain entities are persisted
- **Port Interfaces**: Define contracts for external services
- **Use Case Interfaces**: Define operations that can be performed

## Data Flow

A typical request flows through the system as follows:

1. Input adapter receives a request
2. Input adapter transforms the request into a DTO
3. Use case processes the request, using domain entities and repositories
4. Use case returns a result DTO
5. Input adapter transforms the result DTO into a response

## Testing Strategy

The architecture enables comprehensive testing at all levels:

1. **Unit Tests**: For domain entities and use cases
2. **Integration Tests**: For adapters and repositories
3. **End-to-End Tests**: For complete flows through the system

## Conclusion

This Clean Architecture implementation provides:

1. Independence from frameworks
2. Testability
3. Independence from UI
4. Independence from databases
5. Independence from external agencies

These benefits make the system more maintainable, testable, and adaptable to changing requirements.
