# Introducing Genix

`genix` is a new zero dependency library for build [event driven](https://martinfowler.com/articles/201701-event-driven.html) applications,it make easier reach a low coupled code base and at the same time give us a set of tools that make the testing process very smoothly.
The main building blocks in `genix` are events and commands, this concepts are very similar being its main differences semantics.
In this post I want present its the basic features, and then in future posts show how we can use it with more complete examples. Being said that let's start.

## Events

As I mentioned `genix` allow us develop applications very easy to test, with low levels of coupling through the use of events.
An event as usual represent something that happened or changed and they can be used as a notification mechanism that connect different components of our applications.
Example of events can be **orderReady**, **userLogged**, **paymentDone**, always they should communicate actions that have already ocurred.
We can work with events using the following functions:

```ts
onEvent(eventName, handler); // register a handler for some event name

emit(eventName, ...arguments); // emit an event so every handler function associated to it will be executed
```

Let's implement an example which will be a counter that increase a value every second and after 10 seconds the value is restored to zero, it's is a very simple problem but it serve to show events in action.

```ts
import { onEvent, emit } from 'genix';

function counter(initialValue) {
  let value = initialValue;

  onEvent('tick', () => {
    value++;
    console.log(`Value updated ${value}`);
  });

  onEvent('10SecondsPassed', () => {
    value = initialValue;
    console.log('Set Initial value ');
  });
}

function ticker() {
  setInterval(() => emit('tick'), 1000);
  setInterval(() => emit('10SecondsPassed'), 10000);
}

function main() {
  counter(0);
  ticker();
}

main();
```

From the previous snippet we can say:

- `counter` and `ticker` don't know anything about each other, they are completely independent being this a basic feature of pub/sub mechanisms.
- handlers should be registered before emit events, as you can see `counter` function is executed before `ticker`.
- privacy is reached through JS closure, this is something not obtained from `genix` but I think is good highlight it.
- In this example wasn't used, but `onEvent` return a subscription object with an `unsubscribe` method that allow us cancel handlers in order to avoid memory leaks.
- The API of our components specifically `counter` in this case are the events that they register.

## Commands

On the other hand in **genix** we have commands. Commands are similar to events in the sense that a command has a name with a handler associated to it, but besides that they have important differences.

First of all semantically a command represent a future action, they are like an order that we want execute, so when we run a command we are triggering an action.
Second **we can have only one handler per command**, if we try to associate two handler to the same command we get an exception, so with events we can have more than one handler for the same event but this isn't the case with commands.
Last but not least **when a command is executed it can return some value** , based that a command is an action that we are executing, we can get a value returned from it.
Commands should be named with a verb in imperative mood, for example **finishOrder**, **loadData**, **executePayment**.

In the command API there are 2 functions, one to register commands and another to execute them:

```ts
onCommand(commandName, handler); // register a handler for some command name

exec(commandName, ...args); // execute a command passing the arguments
```

Now let's see our counter but using commands:

```ts
import { onCommand, exec } from 'genix';

function counter(initialValue) {
  let value = initialValue;

  onCommand('increment', (amount) => {
    value += amount;
  });

  onCommand('resetValue', () => {
    value = 0;
  });
}

function ticker() {
  setInterval(() => exec('increment', 1), 1000);
  setInterval(() => exec('resetValue'), 10000);
}

function main() {
  counter(0);
  ticker();
}
```

In this snippet we can note that:

- Again `counter` and `ticker` didn't know anything about each other which is very helpful in order to hide implementation details.
- In this case the public API of our `counter` if the set of commands registered.
- `ticker` in this example isn't notifying, instead it's like giving orders, the same behavior is obtained but with different semantic mechanism.

## Testing

After see events and commands in `genix` and how they can be used to connect different components, now is time to speak about testing to show others features of this library.
Testing examples will be around the `counter` function, the implementation will be changed a little bit in order to mix events and commands so we get a more complete example that show many capabilities.

```ts
import { onCommand, onEvent, emit, exec } from 'genix';

function counter() {
  const initialValue = exec('getInitialValue');
  let value = initialValue;

  onEvent('tick', (amount) => {
    value += amount;
    emit('valueUpdated', value);
  });

  onCommand('resetValue', () => {
    value = initialValue;
  });

  onCommand('getValue', () => value);
}

function ticker() {
  setInterval(() => emit('tick'), 1000);
  setInterval(() => exec('resetValue'), 10000);
}

export { ticker, counter };
```

There are 3 important changes in our `counter` function:

- `counter` register a new `getValue` command, it will be used like a getter to expose our `value` variable being that very helpful in our tests.
- It depends on `getInitialValue` command to get the initial value that now isn't passed as argument, so to `counter` work properly this command should be defined in some way.
- When the `tick` event is emitted `counter` update `value` and emit a new `valueUpdated` event passing the new value as argument.

Let's write a few tests for `counter` and at the same time explaining the testing tools that `genix` provide.

```ts
import { counter } from './counter';
import genix from 'genix';

describe('Counter', () => {
  it('should allow get the actual value', async () => {
    // using genix to build a wrapper around the function tested
    const wrapper = genix.wrap(counter);

    // mocking getInitialValue command
    wrapper.onCommand('getInitialValue', () => 10);

    // indicating that getValue will be executed, this is a lazy execution so for now nothing happen
    wrapper.exec('getValue');

    // running our wrapper
    const { data } = await wrapper.run();

    expect(data).toBe(10);
  });
});
```

- **Always the function tested must be wrapped**, is this isn't done can occur some race conditions between tests.
- Every tests using `genix` testing tools should be `async` because the `run` method return a promise.
- `onCommand` method of our wrapper allow us mock commands that we have as dependencies.
- `exec` method of our wrapper indicate a command that will be triggered against the function tested, this method can receive arguments after the command name.
- Before the `run` call nothing happen, in this way can be said that that our wrapper behave lazily, for example `exec` indicate a command that we can trigger but only as specification, only when `run` is called is that actually the command is executed.
- `run` execution return a promise containing an object, this object has a `data` property that represent the value returned by the last command triggered against of our function, in the previous tes was declared only one command `getValue` to happen so data will be the return value of it.

Now let's apply all of this to another test, and show how events can be emitted in our tests

```ts
describe('Counter', () => {
  it('should react to tick event correctly', async () => {
    const wrapper = genix.wrap(counter);

    wrapper
      .onCommand('getInitialValue', () => 0)
      .emit('tick')
      .emit('tick')
      .exec('getValue');

    const { data, events } = await wrapper.run();

    expect(data).toBe(2);

    expect(events.valueUpdated.length).toBe(2);
    expect(events.valueUpdated[0]).toBe(1);
    expect(events.valueUpdated[1]).toBe(2);
  });
});
```

- `genix` wrappers expose a fluent API so the wrapper methods can be chained.
- The `run` call besides `data` also expose a `events` property, this is a object in which every property correspond to an event emitted by our function during its execution.
- In this test the only event emitted was `valueUpdated` so we have a property with the same name on `events` this `valueUpdated` property will be an array containing the list arguments used to emit this event, so `events.valueUpdated[0]` contain the arguments used the first time when `valueUpdated` was emitted.

Let's finish with a simple test to check the behavior of `resetValue` command.

```ts
describe('Counter', () => {
  it('should reset value correctly', async () => {
    const wrapper = genix.wrap(counter);

    wrapper
      .onCommand('getInitialValue', () => 5)
      .emit('tick')
      .exec('resetValue')
      .exec('getValue');

    const { data } = await wrapper.run();

    expect(data).toBe(0);
  });
});
```

Summarizing `genix` features that makes tests easier we have:

- Allow different environment for every test .
- events can be emitted and commands triggered during testing.
- commands used as dependencies can be faked.
- events emitted during testing are fully exposed.
- access to the result value of the last command executed in our chain of operation , make easier test side effects.

## Conclusion

Until this point was described the two main building blocks that `genix` provide us to build event driven applications, they are events and commands.
The idea of this post as I mentioned is show the public API of this library and its capabilities, in future posts I will show some more real world examples using it along with [React](https://reactjs.org/) and also with [Express](https://expressjs.com/es/) in the backend side.
The advantages of `genix` can be seen mainly in large application which involve the interaction of many components from severals domain, in this cases the coupling between different parts can be decreased a lot.
This ideas of event driven should not be arbitrary applied because this can lead to more problems than it solve, so `genix` can work as a tool but is important have a good architecture.
The library is very new, it born from my own ideas onto how make my applications easier to test, feel free to try it and any kind of feedback or contribution is more than welcome, you can find the source code [here](https://github.com/omenlog/genix).
There are many things to improve like documentation, type coverage, etc..., so stay tuned.
