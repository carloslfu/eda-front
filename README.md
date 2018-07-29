# Using EDA in frontend

Using CQRS / ES in the frontend, my objective is to make an ubiquotus framework for both server and client side and as starting point this library implement the frontend part. This library should work well with a client side that uses EDA, CQRS / ES and microservices, thats the main goal, we can share code or interfaces (TypeScript).

The implementation is simple, is event centric, thus uses an event bus as central part of the architecture. Some points:

1. UI produce commands product of the users intention, e.g. IncrementCounter, UserSignUp or Login. You can send an event from UI as a shortcut if there are no validation stuff or something you should put inside a command
2. Command handlers validate commands and dispatch events if needed
2. Reducers aggregate state inside components, refreshing the UI
3. Event handlers can dispatch commands and events
4. External modules can interact with the UI using the event bus, e.j. sagas or adapters
