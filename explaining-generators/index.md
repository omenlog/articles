# Explaining Generators

Today I want to explain my mental model about **Generators** in JavaScript. I'll try to do this mixing technical concepts with my own view of how they fit together. Summarizing I'll be talking about **Iterators,Iterables** and **Generators**.

Very often I see some sort of confusion around generators concept, based in the fact that there are many terms and expressions used when developers speak about them,this make a little bit hard to figure it out what it's happening. I went through this confusion the first time that I ear about it, and the situation is worst for junior developers. The first pieces of information that I read about generators 2-3 years ago was somethings like:

- The are function that don't run-to-completion, they can stop its execution in the middle of the function body, and can be resumed later either right away or later in time.
- When you run a generator function `const it = gen()` you actually don't run code in the generator instead you get and iterator but if you log `it` in the console you get `Object [Generator] {}`
- They allow bidirectional communication improving the async flow control

![wdf](https://media.giphy.com/media/lT4sgCJwC7B4c/giphy.gif)

From that comments I had the following issues:

- Why I want a function that doesn't run-to-completion ?
- I run the function but it in fact not ran.
- What is an generator object.

Even though they were added on ES6, today I think that generators are a blurry concept for many developers, many don't use it or try to avoid, sometimes because they don't find a use case that is very well suited for generator or are developers that simply don't fully understand the concept. So let's begin with the explanations.

> Note: The concepts exposed here are relevant to JavaScript, they are available in another languages as well but I'm focus on its relevance for JS.

## Iterator

In my opinion for gain a clear understanding around **Generators** we need to understand another underlying concepts related to them, and in that way conform the base over which generators are developed. The first of this concept is `Iterators`. Adapting an simplifying the definition from the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) we have:

> The **iterator protocol** defines a standard way to produce a sequence of values (either finite or infinite). An **object is an iterator** when it implements a `next()` method that allow us consume the values from a container.

So and iterator allow us produce and/or traverse values that belongs to a container, note that this container not necessarily must be a list,it can be an object, set, tree, graph, map or simply values generated on demand. The **iterator protocol** mentioned in the definition give us and standard way to consume values, in summary the protocol define the following:

1. the values can be consumed calling the `next()` method.
2. the `next()` method return and object with two properties:
   - `done`: A boolean that indicates a completion status of the iteration, using this property the consumer is able to know if all the values were consumed or not.
   - `value`: current iteration value or final return value

for example:

```js
const container = [1, 2];

const iterator = {
  index: 0,
  next() {
    if (this.index === container.length) {
      return { done: true, value: undefined };
    }

    return { done: false, value: container[this.index++] };
  },
};

console.log(iterator.next()); // {done: false, value: 1}
console.log(iterator.next()); // {done: false, value: 2
console.log(iterator.next()); // {done: true, value: undefined}
```

So in this example we have the following:

- `container` **array is not an iterator by itself** if we execute `container.next()` we get `TypeError: container.next is not a function`, see how the container doesn't obey the iterator protocol and doesn't know how its values can be consumed.
- `iterator` object implement the **iterator protocol** through it's `next` method,allowing us consume `container` array values.

## Iterables

Now that we saw in brief the concept of Iterators lets talk about Iterables. As in the case of Iterators, based on the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) documentation we can define Iterables as:

> In order to be iterable, an object must implement the `[Symbol.iterator]` method, the implementation must be a zero-argument function that returns an iterator.

If an object meets the previous definition then it's and iterable, and follow the **iterable protocol**. This protocol is just an standard way to allow containers define or customize their iteration behavior.

> Exist many tools built in the language that are integrate with this **iterable protocol**, as example can be [for...of](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Sentencias/for...of) loops, [spread operator](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Operadores/Sintaxis_Spread),etc... Also the main data structures of the language are **iterables** by default, this is the case of String, Arrays, Sets, Maps.

After all of this we can simply say that an **iterable** has a method stored in a very specific property(`Symbol.iterator)` that when is executed return an _iterator_ that can be used to consume the iterable values.

Example:

```js
const iterable = [1, 2];
const arrayIterator = iterable[Symbol.iterator]();

console.log(arrayIterator.next()); // {value: 1, done: false}
console.log(arrayIterator.next()); // {value: 2, done: false}
console.log(arrayIterator.next()); // {value: undefined, done: true}
```

In this snippet we consume the values of the array `iterable`, but without implement by our self the iterator just using what the language provide to us.

Let's see another example but now making our own iterable, we will make a plain object iterable and the iteration should will be over its properties, also lets be a little bit funny and implement a simple functions that allow us consume values from iterables

```js
/*
  - The keys of an object can be retrieved using Object.keys 
    you know that,
    but this is a just a simple example.
*/

/* Function that allow another function consume an iterator */

function consumeIterator(consumerFn, iterator) {
  const iterResult = iterator.next();

  /*
    Note that this function is very naive, 
    and assume that when the iterator is done its value is undefined 
  */

  if (iterResult.done !== true) {
    consumerFn(iterResult.value);
    consumeIterator(consumerFn, iterator);
  }
}

/* Function that allow another function consume an iterable */

function consumeIterable(consumerFn, iterable) {
  const iterator = iterable[Symbol.iterator]();
  consumeIterator(consumerFn, iterator);
  console.log('Iterable consumed\n');
}

/* by default object literals are not iterables */

const objectIterable = {
  foo: 1,
  baz: 2,

  /* lets add our special property to make it iterable */

  [Symbol.iterator]() {
    const keys = Object.keys(this);
    return Array.prototype[Symbol.iterator].call(keys);
  },
};

/* Consume our iterable object using our new helper function */

consumeIterable(console.log, objectIterable);

/* Consume the object again but now applying a different consumer function */

const logUpperCase = (value) => console.log(value.toUpperCase());

consumeIterable(logUpperCase, objectIterable);
```

After running this piece of code the output is:

```
foo
baz
Iterable consumed

FOO
BAZ
Iterable consumed
```

The code has a plenty of comments, anyway if you have a question don't hesitate on leave it in the comments section. In the previous example we were able to write functions that work over any iterable/iterator thanks to the protocols.

If the implementation for `[Symbol.iterator]` in our iterable object looks a little bit confusing you can read my previous [article](https://dev.to/omenlog/javascript-why-this-1lf0) about how `this` behave in JS to reach a better understanding.

## Generators

OK so far we saw that iterators allow us consume values from some specific container, and iterables define an common interface to expose iterators so ...What about generators ?

#### Generators are a simply and very straightforward way of **generate** iterables and iterators.

For me this is how I think about generators, they are a function that define how values from some iterable are emitted, I think that is more easy think about in term of iterables that we want use in our application, and from there about a generator that emit those values, rather than not thinking about functions that doesn't fully run and all the other stuffs regarding to generators , at least in order to start using them . I'm not saying that is wrong all of the other facts about generators indeed they are correct, I'm just only exposing how is more easy for me think about consume iterables.

Some advantages of generators are:

- They return an object(`Object [Generator]`) that is `iterator` and `iterable` at the same time.
- The values returned or yielded from the generator are automatically wrapped as an object that meet the iterator protocol.
- With them is easier to keep iterator inner state without necessity of extra variables
- Generators allow inject data before create the iterator making the whole process more dynamic.
- They allow communication in both direction acting as a pulling and pushing mechanism at the same time.

lets see one example:

```js
/* a function generators is declared using function* */

function* gen() {
  /*yield mean a pause point and emit a value that can be consumed */

  yield 1;
  yield 2;
}

const iter = gen();

/* look how iter is an iterator */

console.log(iter.next()); // {value: 1, done: false}
console.log(iter.next()); // {value: 2, done: false}
console.log(iter.next()); // {value: undefined, done: true}

/* at the same time the value returned by the generator is an iterable */

const iterator1 = gen();
const newIt = iterator1[Symbol.iterator]();

console.log(newIt.next()); // {value: 1, done: fasle}
console.log(newIt.next()); // {value: 2, done: false}
console.log(newIt.next()); // {value: undefined, done: true}
```

Two things to note here are how we are yielding a number but the consumer get an object under the **iterator protocol**, and for show that the generator also return an `iterable` we call again the `gen` generator, we do this to avoid extract the iterator directly from the `iter` iterable because when an iterator generated reach its done state it remain there in every successive call to `next`.

Lets recreatee our previous example related to object keys:

```js
function* genObjectKeys(obj) {
  for (const key of Object.keys(obj)) {
    /* pausing point, 
       inner state of the loop is automatically manage by the interpreter */
    yield key;
  }
}

/* we can dinamicaly inject the object at creation time*/

const it = genObjectKeys({ foo: 1, baz: 2 });

/* we can use our previous helper, this is a huge advantage that protocols give us */

consumeIterator(console.log, it);
```

## Conclusion

So with this we saw a very basic overview of how iterators, iterables, and generators are in a very strict relation. There are many aspects regarding this concepts that I skipped in order to cover the basics, somethings like async iterators, iterators composition, bidirectional communication using generators, etc ...

Anyway if your are interested in some of this topics or want see a more realistic example using generators let me know in the comments.

Thank you for read
