Recently I was working on a project with Angular 7 when a teammate told me about a problem he had within a component, the problem was that he subscribed to an observable returned by one service implemented in the application and within the callback in charge of receiving the values did not have access to an attribute defined in the component.

![Initial Code](https://miro.medium.com/max/1400/1*72Xw2n2C_V8CfZeYGS70qQ.png)

Specifically, the problem was on line 14 that `data` isn't defined as property of `this` 🙄🤔.

After analyzing the code I told him that the problem wasn't related to Angular, and to understand the cause of it he should know how `this` binding works in JavaScript. A few days after I told about this error to another colleague, and while I explain it I realized that he also didn't have a complete understanding of how `this` work.

> In the article `this` is used to represent the JavaScript keyword and not the English word

Currently JavaScript is within one of the most used languages worldwide, I think it's very common to find developers working with JavaScript that use `this` without really understanding the basics of this feature that the language provides us. I think this is largely due to the introduction of pseudo-classes in ES6, since they try to imitate a similar syntax for the definition of **classes** to that of other languages, and therefore less experienced developers tend to associate `this` in the same way that it works in other programming languages (my colleagues had worked with PHP and C# respectively).

## `this` binding

The keyword `this` in JavaScript is automatically defined inside of the scope of any function `f`, and within each `f` we have that `this` represents a given object. The problem really with `this` is that the object represented is not defined by the way we implement the function, but is defined dynamically at run time depending on how we call the function, that is, the object represented by this hasn't nothing to do with where `f` is declared, but it has to do with the way `f` is called.

Simplifying we can say that the interpreter uses 5 rules to determine the object that `this` represents within `f`, we will explain each of these rules and then define their precedence levels.

### Default binding

The first rule that we will examine is the simplest of all, and applies whenever one of the others is not applicable, so we can also say that it is the rule of least precedence.

The **default binding** is applied when a function `f` is called in the form `f()`. When this rule is applied `this` points to the global scope, note that this has the consequence that if we modify `this` within the function for example by inserting some property it will be accessible even after executing the function because it would be defined globally, for example:

![default binding](https://cdn-images-1.medium.com/max/1116/1*tKTyizs7sKoQE_rACZgpWQ.png)

_It is valid to clarify that the variable `name` within the global scope is accessible only in the case of browsers, for the case of Node on line 6 it would have been printed `undefined`_

In the previous snippet it is exemplified as `this` points to the global scope.

In the case that we execute our script in `strict mode` at the time of applying the default binding the interpreter doesn't allow this to represent the global scope, therefore this will point to undefined. The previous snippet running in `strict mode` throw the following error:

```
TypeError: Cannot read property 'name' of undefined
```

### Implicit binding

The second rule or **implicit binding** is applied in the case that a function `f` contained in an `obj` object is executed using dot notation for its execution `obj.f()`, example:

![implicit binding](https://cdn-images-1.medium.com/max/1116/1*Jex3sxvrf8YF96yz6wMTLQ.png)

In the previous example we see how both objects contain `printInfo` property that refers to the same function, but despite this when executing the function in one case `this` represent the `dwarf` object, while for the other it's `threeEyesRaven`. This is because in each of the calls to the function an object is used, which we can name as `context`, in this case the **implicit binding** define that within the function `this` points to the context object, therefore saying `this.name` would be the same as saying `dwarf.name` or `threeEyesRaven.name` depending on the object used in the call.

#### Lost Implicity

It's very common for some developers to lose at some point in the source code the **implicit binding** defined for some specific object, which means that the binding that is applied would be the default binding having `this` pointing to the global scope or `undefined.` This can happen when we use callbacks, for example:

![lost biding](https://cdn-images-1.medium.com/max/1116/1*UK0F4zdHH4qc6KCxOt4ktg.png)

What happens is that here we are passing directly to `setTimeout` a reference to our function `printInfo` without passing the object where it's contained, on the other hand we have no control of how `setTimeout` call the function, to better understand what happens suppose this pseudo implementation of `setTimeout`:

![pseudo set timeout](https://cdn-images-1.medium.com/max/1116/1*_JDuxOD-5Hc8LGys7VdbqA.png)

Analyzing the call-site of `fn` in the previous snippet is easy to conclude that the default binding is applied and the explicit binding that was previously available is lost, because dot notation isn't used to call the function.

### Explicit Binding

So far we have seen 2 rules to determine the value of `this` within a function, the first applies when we call the function as standalone function and the second when the function is executed by accessing it as part of an object.

Next we will see another type of binding for the case in which we explicitly define the object to which `this` points within a function, this type of binding is known as **explicit binding**.

To get into the explanation of this type of binding we must start talking about 2 methods present in every JavaScript functions, these methods are **apply** and **call**. Both methods take the object to be pointed by `this` as the first parameter and then execute the function with this configuration. Because we directly indicate what will be the value for `this` when executing the function we are in presence of **explicit binding**. For example:

![expliciti binding](https://cdn-images-1.medium.com/max/1116/1*xVgfzJBrCKxuss3C5qdOow.png)

In the previous example, we noticed how the first time we executed the `print` function, it print "Rob Stark" because that is the value of the name property of `kingInTheNorth` object which contains the `print` function and therefore applying the **implicit binding** when executing the function `this` will point to the object. The second time we execute the function then "Jon Snow" is printed instead of Rob Stark even though we are accessing to the same function contained in the kingInTheNorth object, what happens is that in the function's call-site we are calling the `call` method and explicitly indicating that the function is executed using the `newKing` object as `this`, so in that case within the function `this.name` refers to `newKing.name`.

#### Explicit binding with `bind`

Sometimes is desirable to indicate `this` for some function without executing it. For this case, each function has a `bind` method which, like `apply` and `call`, takes as its first parameter the object that `this` will represent but instead of executing the function `bind` returns a new function with `this` already linked to the specified object, let's look at the following example:

![using bind](https://cdn-images-1.medium.com/max/1116/1*WKx5cBmyNDpf0P2m9dOhCA.png)

Here we see from the same `house` function two new functions were created through the use of `bind`, using in each case different objects to represent `this`, note how in the `bind` call the `house` function is not executed at any time, in this way at the end we have created a house for the Targaryen and a house for the Tyrell.

### `new` Binding

To understand the new binding we must know what happens when a function is called preceded by `new`, in this case the following occurs:

1. A new object is created.
2. The new object is linked to the prototype of the function executed.
3. The new object created is set as `this` within that function.
4. Unless the function returns something different, the new object is automatically returned by the function.

> For simplicity, let's completely ignore the step 2 it and let's focus on the others

![new operator](https://cdn-images-1.medium.com/max/1116/1*5temsTtFxm1aKXe0FDVfAA.png)

Here we see how each time the function is invoked using `new`, a new object is created on each call, this object is automatically returned from the `King` function even though it doesn't have return statement.

> Currently the vast majority of developers don't use `new` to execute functions but when invoking es6 classes, in this example a function were used because we are analyzing the behavior of this within functions , although classes are at the end functions as well 😎😉.

### Arrow functions

A new way of declaring functions was introduced in ES6(**arrow functions**), to declare a function in this way we use the operator `=>`, for example:

![arrow function](https://cdn-images-1.medium.com/max/1116/1*oICt75FRk6NT16ynqVxHwg.png)

One of the features of this approach is that the functions alter the behavior of `this`, so that it's not dynamic depending on the function's call-site, but is lexical. In a simplified way, `this` within an arrow function represents the same object that it represented in the parent scope that contains the defined function, that is, the arrow function inherits `this` from the enclosing scope, example:

![arrow function2](https://cdn-images-1.medium.com/max/1116/1*5Fzl8KMU-t5psdgHQwpKrA.png)

Observe that when the timer is executed we don't lose the reference of `this` pointing to `HouseStark` object, which happens in case that we pass an anonymous function `function(){}` to `setTimeout`, the above is because we are using an arrow function as timer first argument. The parent scope in this example is defined by the `printMembers` function, when executing this function from the `HouseStark` object, the implicit binding is applied and `this` will be the object itself, as a consequence then `this` within the **arrow function** will be `HouseStark` object so we can access to all its properties without problems.

## Determining `this`

To know what `this` represent within a function we first find the call-site of that function, remember that this depends directly on the way in which the function is executed, then we follow this steps:

1. (**new binding**) Is the function called using `new` ? If so, `this` points to a new empty object built before executing the function.
2. (**explicit binding**) Is the function executed using `call` or `apply` ? `this` points to an object explicitly specified as the first parameter of the call.
3. (**implicit binding**) Is the function executed by accessing it through an object that contain it ? In that case, `this` represent the object that contains the function as one of its properties.
4. (**default binding**) In another case `this` points to the global scope or `undefined` if we are in `strict mode`.

In case of arrow functions then `this` will be inherited from the enclosing scope, and this in the enclosing scope is determined following the previous steps.

## Conclusions

As a recap we can say that `this` in JavaScript is dynamically defined at run time, depending on the call-site of a function. There are 4 different types of binding. Using arrow functions we can say that it would not have its own `this` but inherits it from the enclosing scope.

Now that we have talked in detail about `this` , would you know what is the problem in the code published initially 👍

> For more information on the subject I highly recommend this [book](https://www.amazon.com/-/es/Kyle-Simpson/dp/1491904151) from Kyle Simpson
