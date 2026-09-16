# Performance and Security

## Performance

Before adding code, consider:
- unnecessary API requests
- duplicate requests
- excessive Redux updates
- unnecessary component renders
- large lists
- image memory
- expensive computations on the JS thread
- event/listener leaks
- timers that are not cleaned up
- WebSocket/realtime subscription cleanup
- large payloads
- pagination and incremental loading

For large lists, inspect the existing FlashList usage before introducing another list strategy.

Do not optimize by guesswork. Prefer profiling, measurements, or clear reasoning.

## React Native lifecycle

Every subscription, listener, timer, socket, or native event registration must have a clear cleanup path.

Avoid stale closures and race conditions in asynchronous effects.

## Security

Never hardcode:
- API keys
- access tokens
- passwords
- private keys
- credentials

Never log authentication headers or sensitive message/customer data.

Validate untrusted API data at boundaries when the application relies on its shape.

Authentication and authorization behavior must remain explicit.

Do not weaken security checks to make a feature easier to implement.
