# Why generators matters

In a previous [article](https://dev.to/omenlog/why-we-have-generators-3bg6) I described the concept of generator in JS, there was explained the strong relation that exists between **Iterators**, **Iterables** and **Generators**.
Now in this post I want to focus on one specific feature that make generators unique inside of JS landscape, this is:

<center>
    <h2>Bidirectional communication</h2>
</center>

## Push and Pull protocols

In order to understand what is bidirectional communication(BC) first `Push` and `Pull` as communication protocols, between data producers and consumers should be understood.

With `Pull` the consumer is who determine when the data is received from the producer.
Functions are the simpler example of pull in JS. For any function `F` is true that it doesn't know when the data will be produced or in another way `F` doesn't know when it will be executed, the consumer has all responsibility over the `F()` call to pull some kind of data.

In the other hand with `Push` protocol the producer has full control over the moment when the data is produced, the consumer doesn't know neither when or how the data is produced.
`Promises` comply with this definition of `Push`.
For every promise `P` a callback should be passed to its `then` method in order to get the promise data asynchronously, later at some point this callback will be executed when the promise is fulfilled, in this case the callback doesn't know about how the data was produced, the inner implementation of `P` determine when data is pushed to our callback.

> _Iterables are another example of `Pull` and Observables works as a `Push` mechanism._

## Bidirectional communication using generators

Bidirectional communication over generators is based on the fact that they support `Pull` and `Push` at the same time, or in other words generators can be at the same time data consumers and data producers.

An example of generator as data producer:

```js
function* producerGen() {
  yield 1;
  yield 2;
  yield 3;
}

function consumer() {
  const it = producerGen();

  console.log(it.next()); // {done: false, value:1 }
  console.log(it.next()); // {done: false, value:2 }
  console.log(it.next()); // {done: false, value:3 }
}
```

In this example `producerGen` is only acting as producer, the values are consumed inside of `consumer` function, here we have a pulling happening through our `it` variable.
But a generator can consume data and producing it as well:

```js
function* generator() {
  const dataFromOutSide = yield 1;
  console.log(dataFromOutSide); // 2
}

function consumer() {
  const it = generator();

  const dataFromGenerator = it.next().value;

  console.log(dataFromGenerator); // 1

  it.next(2);
}

consumer();
```

Analyzing this piece of code step by step, first iterator `it` is obtained from `generator` function.
The first call to `it.next()` run `generator` till the point when it reach the `yield` keyword, at this point the execution of `generator` is paused and `1` is send to outside, acting `generator` in its roll as data producer.
Then the value emitted from `generator` is printed and `next` is called again but passing an argument in the call `it.next(2)`, when `next` is called with an argument `generator` execution is resumed, and also the previous `yield` expression is replaced by the argument used in the call to `next`, in this example `yield 1` will be replaced by `2` so the variable `dataFromOutside` will receive `2`.

![bidirectional-flow](images/bidirectional-flow.gif)

This gif show the communication flowing in both directions from side to side, so is clear how `generator` produce and consume data, in fact `consumer` function is also a producer.

## Advantages of Bidirectional Communication

After understand this feature, someone might wonder _What are the benefits of bidirectional communication ?_, and the answer is:

- separation of concern
- inversion of control
- code easier to test
- high level of decoupling

As example I'll implement a function two times one using `async-await` and another using generators, in order to analyze what is gained from bidirectional communication in the generator based implementation.
Suppose a function to get user data that first check if the user is in cache else it request the data from server.

```js
async function getUserData(userId) {
  const userOnCache = await cache.get(`user:${userId}`);

  if (!userOnCache) {
    const userFromBackend = await server.getUser(userId);
    return userFromBackend;
  }

  return userOnCache;
}
```

> _Error handling is not covered for simplicity_

Thinking a moment about this function with unit tests in mind first thing to note is that `getUserData` depends on `cache` and `server`, is known that during unit tests should be avoided any call to backend and also any read against cache storage, therefore to test this function in isolation its dependencies should be mocked.
But mocking is a big topic in software development, there are many libraries dedicated to make easier mocks creation and in other hand there are some opinions about [mocking as a code smell](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a), besides all of this, developers claiming testing as a difficult task is a fact, mainly in situation when they have a implementation with high level of coupling and therefore should be implemented many mocks, this developers don't enjoy the testing process or worse they decide not to test the code at all.

> _`getUserData` can be implemented using some sort of dependency injection making it easier to test but this topic is out of the scope._

After use `async-await` and conclude that mocks are needed for unit test
let's see what happen in the implementation using generators, for this `async` will be replaced by `function*` and every `await` sentence by `yield`.

```js
function* getUserData(userId) {
  const userOnCache = yield cache.getUser(`user:${userId}`);

  if (!userOnCache) {
    const userFromBackend = yield server.getUser(userId);
    return userFromBackend;
  }

  return userOnCache;
}
```

Now `getUserData` is a generator that will `yield` promises. Write unit tests for this generator is simple, for example a test for the use case when we don't have user data in cache so we get our user from the server can be:

```js
import { getUserData } from './get-user-data';

it("should get user data from backend when user isn't cached", () => {
  // fake user data
  const userData = { name: 'Jhon', lastName: 'Doe' };

  // get an iterator from generator, remember this iterator will emit promises
  const it = getUserData('user123');

  // run generator til the first yield
  it.next();

  // resume generator execution passing undefined as data
  it.next(undefined);

  // resume generator, passing to it userData simulating the server response,
  // also retrieve the next value emitted by it,
  // at this point value came from the return statement
  const { value } = it.next(userData);

  // check that the correct data was returned
  expect(value).toEqual(userData);
});
```

This show how easy is to test the code using bidirectional communication.
The difference with the first implementation is that with `async-await` promises are send to JS engine and it will be in charge to resolve them and resume the function execution, that communication between the engine and our code can't be intercepted, so for test the function in isolation its dependencies should be mocked.
In other hand generators give full control over the promises yielded by `getUserData` so they can be intercepted allowing pass to our generator whatever kind of data, indeed `getUserData` is totally unaware is the promise was resolved or if is fake data being injected.

This test could seem very brittle, coupled to our implementation, because `next` calls are linked to `yield` statements of `getUserData` also for every call to `next` should be passed manually the correct type of data, having this as a consequence that a little change one the implementation might break the test.
For sure this is true this test can be improved, but I'm only showing how powerful BC is, maybe I cover this topic in a future post.

One drawback of generators is that with `async` functions they can be invoked and the language knows how to execute them, awaiting and resuming promises automatically.
The same isn't true for generators, I mean JS doesn't what kind of values generators will produce and what should be done with them, so we as developers are in charge to get data and resume the execution of our generators.
But don't worry if we know what type of values will be yielded then we can implement a function that pull values from our generator and resume it automatically.

> _This idea of write generator runners is not new and is used by some [libraries](https://www.npmjs.com/package/co)_

A siple `run` function that can execute generators can be:

```js
async function run(iterator) {
  let iteratorResult = it.next();

  while (!iteratorResult.done) {
    const result = await iter.value;
    iteratorResult = it.next(result);
  }

  return iteratorResult.value;
}
```

`run` will receive an `iterator`, then get the first data using `next()`, after that it will continue retrieving data from `iterator` while it isn't done, for every piece of data we `await` the property `value` to resume our generator passing the promise `result` in the `next` call, by last we return the last value emitted by `iterator`.

![run-generator](images/run-generator.gif)

Run can be used like:

```js
run(getUserData('user123')).then((userData) => {});
```

## Conclusions

In summary this post explained very briefly `Pull` and `Push` as communication protocols also how bidirectional communication works on generators.
We explored this feature transforming a generators in data producers and consumers.
As example the behavior of `async-await` was reproduced using generators, trying to exemplify how easy is build tests for a generator based implementation.
This post isn't a comparative between generators and `async-await`, both are powerful and I'm really glad that JS support them. Hopefully you understand the basics of BC after this read, in the future post I'll continue writing about it exposing what we can achieve.

Thanks for read.
