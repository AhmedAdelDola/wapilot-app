# Clean Code, SOLID and OOP

Apply these principles pragmatically.

## Clean Code
- Use meaningful names.
- Keep functions and components focused.
- Prefer early returns when they improve readability.
- Avoid deep nesting.
- Avoid duplicated business rules.
- Avoid magic strings/numbers.
- Remove dead code and unused imports.
- Comments explain WHY, not obvious WHAT.

## SOLID
- Single Responsibility: keep classes, services, hooks, slices, and components cohesive.
- Open/Closed: prefer extension points where new behavior is expected.
- Liskov: implementations must honor their contracts.
- Interface Segregation: prefer focused types/contracts.
- Dependency Inversion: isolate business logic from concrete infrastructure when useful.

Do not create interfaces, factories, wrappers, or services only to satisfy SOLID.

## OOP
Prefer composition over inheritance.

Use classes only where they provide a real benefit. In this TypeScript/React Native codebase, functional composition and typed modules are often more appropriate than class-heavy OOP.

Do not force classical OOP patterns into React components.

## Duplication vs abstraction
Do not immediately abstract two similar pieces. First determine whether they represent the same business concept.

Prefer a simple duplicate over a premature abstraction if the future behavior may diverge.
