const assert = require('assert');

const pipe = (...fns) => (value) => fns.reduce((x, fn) => fn(x), value);
const repeat = (times, char) => new Array(times).fill(char).join('');

function divider(a, b) {
  return {
    cocient: Math.floor(a / b),
    rest: a % b,
  };
}

function process(romanChar, decimal) {
  return (arg) => {
    const { num, roman } = arg;

    if (num === 0) {
      return arg;
    }

    const { cocient, rest } = divider(num, decimal);
    const newRomanChars = repeat(cocient, romanChar);

    return {
      num: rest,
      roman: `${roman}${newRomanChars}`,
    };
  };
}

const convert = pipe(
  (num) => ({ num, roman: '' }),
  process('M', 1000),
  process('CM', 900),
  process('D', 500),
  process('CD', 400),
  process('C', 100),
  process('XC', 90),
  process('L', 50),
  process('XL', 40),
  process('X', 10),
  process('IX', 9),
  process('V', 5),
  process('IV', 4),
  process('I', 1),
  ({ roman }) => roman
);

assert(convert(1) === 'I', '1');
assert(convert(4) === 'IV', '4');
assert(convert(5) === 'V', '5');
assert(convert(10) === 'X', '10');
assert(convert(50) === 'L', '50');
assert(convert(100) === 'C', '100');
assert(convert(500) === 'D', '500');
assert(convert(1000) === 'M', '1000');

assert(convert(78) === 'LXXVIII', '78');
assert(convert(410) === 'CDX', '410');
assert(convert(910) === 'CMX', '910');
assert(convert(510) === 'DX', '510');
assert(convert(90) === 'XC', '90');
assert(convert(837) === 'DCCCXXXVII', '837');
assert(convert(1679) === 'MDCLXXIX', '1679');
assert(convert(2378) === 'MMCCCLXXVIII', '2378');
assert(convert(4310) === 'MMMMCCCX', '4310');
