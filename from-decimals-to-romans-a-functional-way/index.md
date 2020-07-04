# From decimals to romans a functional way

Let's explore how we can implement an algorithm that allow us convert a decimal number
in it's roman representation. I like functional programming(FP) so also during the implementation I want use common concepts from FP like **pure functions** , **function composition** , so hopefully this serve as example to show how you can apply FP to problem solving.

We will develop a simple `converter` function that will receive a decimal number as input and output the roman
representation of our input, for example:

```js
convert(1679) === 'MDCLXXIX';
```

## Algorithm

Before deep dive in the implementation, let analyze step by step our conversion algorithm.
First we should know what characters we have available in the roman numeric system and the decimal number that every one of them represent,
we have the following set of characters:

> For simplify our converter the algorithm will be for numbers less than `5000`

<center>

| Roman | Decimal |
| ----- | ------- |
| M     | 1000    |
| CM    | 900     |
| D     | 500     |
| CD    | 400     |
| C     | 100     |
| XC    | 90      |
| L     | 50      |
| XL    | 40      |
| X     | 10      |
| IX    | 9       |
| V     | 5       |
| IV    | 4       |
| I     | 1       |

</center>

> As you see I represented some decimals using two letters example CD, this is in order to avoid in our algorithm the subtractions that
> take place in the roman numeric system, think as this 2 characters as a whole that is associated with a decimal value

The next step is for every decimal number try to decompose it as a sum using only the decimals number exposed previously, we should use the minimum number of operands in our sum let's see an example:

```
decomposed as a sum using the minimum number of operands and only decimal numbers from our previous table

1679 = 1000 + 500 + 100 + 50 + 10 + 10 + 9
1679 = M      D     C     L    X    X    IX

final representation

1679 = MDCLXXIX
```

As we can see, from this decomposition is very straightforward get the roman representation. So this is how our algorithm work, it will go from top to bottom over our available decimals and check if the roman token associated with it should be in our final representation and how many times we should include the respective token.

Our algorithm build the roman number in an incremental way, to check how many times a specific roman token should be present we use the `/` operator in conjunction with the decimal representation of this token against our input, the `%` operator is used in every step to get the remain that we will use as input when processing the next roman character, as we know an example is worth than thousand words so let see how we can transform `38`:

```
Processing X (decimal = 10) (Input = 38) (Roman = "")

    - Find how many times we should include the X character

      times = 38 / 10
      times = 3

      Our number has X 3 times

    - Update Roman concatenating our new character

      newRoman = roman + "XXX"
      newRoman = XXX

    - Find the input for the next step

      nextInput = 38 % 10
      nextInput = 8

Processing IX (decimal = 9) (Input = 8) (Roman = "XXX")

    - Find how many times we should include the IX character

      times = 8 / 9
      times = 0

      Our number has IX 0 time -> NOT PRESENT

    - Update Roman concatenating our new character

      newRoman = roman + ""
      newRoman = XXX

    - Find the input for the next step

      nextInput = 8 % 9
      nextInput = 8

Processing V (decimal = 5) (Input = 8) (Roman = "XXX")

    - Find how many times we should include the V character

      times = 8/5
      times = 1

      Our number has V 1 time

    - Update Roman concatenating our new character

      newRoman = roman + "V"
      newRoman = XXXV

    - Find the input for the next step

      nextInput = 8 % 5
      nextInput = 3

Processing IV (decimal = 4) (Input = 3) (Roman = "XXXV")

    - Find how many times we should include the IV character

      times = 3 / 4
      times = 0

      Our number has IV 0 time -> NOT PRESENT

    - Update Roman concatenating our new character

      newRoman = roman + ""
      newRoman = XXXV

    - Find the input for the next step

      nextInput = 3 % 4
      nextInput = 3

Processing I (decimal = 1) (Input = 3) (Roman = "XXXV")

    - Find how many times we should include the I character

      times = 3 / 1
      times = 3

      Our number has I 3 times

    - Update Roman concatenating our new character

      newRoman = roman + "III"
      newRoman = XXXVIII

    - Find the input for the next step

      nextInput = 3 % 1
      nextInput = 0
```

After this steps we end and Roman = XXXVIII has our input represented as a roman number

Note the following in our algorithm:

- We process roman characters from top to bottom staring from M to I.
- In every step we do exactly the same operations (`/` , `concatenation`, `%`) over our arguments.
- We update in every steps our Roman representation concatenating new characters or maybe nothing.
- We update in every step our `input` that will be used in the next step.
- The `/` operation is used to find how many time a specific characters should be included in our representation.
- The `%` operation is used to find the remaining amount that need to be converted.

## Implementation

Now that we saw how the conversion algorithm works let's go through it's implementation.
First I will start implement some utility functions that we will use.

### Divider

As in every step `/` and `%` operations are used let's start implementing a function that help us with this task:

```js
function divider(a, b) {
  return {
    cocient: Math.floor(a / b),
    rest: a % b,
  };
}
```

### Repeat

We need a function that allow us repeat a character a specific amount of times:

```js
const repeat = (times, char) => new Array(times).fill(char).join('');
```

### Pipe

As I mention earlier we will use function composition in the implementation, for this let's use a `pipe` function. With `pipe` we can for example write `g = arg => f2(f1(arg))` as `g = pipe(f1,f2)`, in this example `g` is composed by `f1` and `f2`, the out of `f1` is passed as and argument to `f2`:

```js
const pipe = (...fns) => (arg) => fns.reduce((x, f) => f(x), arg);

/* 
    If you not follow the pipe implementation don't worry just remind
    that this function serve to pass the output of one function as 
    input to another.
*/
```

Now let's see the implementation, we know that during the conversion we did the same operation in every steps over our input, the only thing different was the roman character and the decimal that is represent. With this in mind let's build a `process` function that receive as arguments a **romanChar** and it's **decimal** representation and return a function `F` that will be responsible to run the conversion algorithm:

```js
function process(romanChar, decimal) {

  /* function to check if our romanChar will we in our final representation */
  return (arg) => {
    /*
        arg:{
          num: decimal number that we are converting
          roman: partial representation of our solution
        }
    */
    const { num, roman } = arg;

    /* num equal 0 imply that there is not anything to transform */
    if (num === 0) {
      return arg;
    }

    /* find how many time we should repeat romanChar and the remain that need to transform */
    const { cocient, rest } = divider(num, decimal);

    /* get the new romans characters */
    const newRomanChars = repeat(cocient, romanChar);

    /* update num as rest and update our actual roman representation concatenating newChars */
    return {
        num: rest,
        roman: ${roman}${newChars}
    }
  };
}
```

Ok until this point we have our `process` function that allow us check if a specific roman character should be present in our final transformation for example `const f = process('V', 5)` give us a function `f` that should receive our `arg` object and determine if `V` should be included in our final solution.

The last step is create a converter function composing different function where each one has
only the responsibility to check one character, our transformation will be passed from one function to another.
At the end we end with an object which `num` is 0 and `roman` is the full conversion,

```js
const convert = pipe(
  (number) => ({ num: number, roman: '' }),
  process(1000, 'M'),
  process(900, 'CM'),
  process(500, 'D'),
  process(400, 'CD'),
  process(100, 'C'),
  process(90, 'XC'),
  process(50, 'L'),
  process(40, 'XL'),
  process(10, 'X'),
  process(9, 'IX'),
  process(5, 'V'),
  process(4, 'IV'),
  process(1, 'I'),
  ({ num, roman }) => roman
);
```

> Note how our `convert` function receive a number and in the first step(first function) we transform it to our `arg` shape so we can start the conversion, also in the last step we get our `arg` object and extract from it `roman` property with the full conversion.

# Conclusions

As we stated at the beginning we used `function composition` and `pure functions` in the sense that none of our functions rely on side effects in every step we don't modify our `arg` instead we a create a new object, that will be passed to the next function in our chain.

This example is simple but I hope that it give you some insights on how you can use this concepts in your every day tasks.
This approach to build our `convert` function in a declarative way give us as advantage that is easier adapt to new requirements, for example our `convert` function can be refactored to work with numbers beyond to 5000 only adding **process(5000,<span style="text-decoration:overline;">V</span>)** without modify our inner `process` function.
