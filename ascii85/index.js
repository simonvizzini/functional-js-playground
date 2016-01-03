import {
    curry, concat, repeat, split, pipe, length,
    splitEvery, map, add, join, slice, replace, last
} from 'ramda';

var log = curry(function (tag, input) {
    console.log(tag, input);
    return input;
});

var log2 = curry(function (tag, fn, input) {
    let padBy = Math.max(0, 20 - tag.length);
    let outTag = padLeft(' ', padBy, tag) + '::';
    let output = fn(input);
    console.log(outTag, input, ' => ', output);
    return output;
});

/**
 * String -> Number -> String
 */
var repeatStr = curry(function (str, amount) {
    return repeat(str, amount).join('');
});

/**
 * String -> Number -> String -> String
 */
var padRight = curry(function (padStr, amount, str) {
    return concat(str, repeatStr(padStr, amount));
});

/**
 * Char -> Number -> String -> String
 */
var padLeft = curry(function (char, amount, str) {
    return concat(repeatStr(char, amount), str);
});

/**
 * Number -> String -> String
 */
var removeRight = curry(function (amount, str) {
    return str.slice(0, length(str) - amount);
});

/**
 * String -> [Number]
 */
var toCharCodes = function (str) {
    return str.split('').map(char => char.charCodeAt());
};

/**
 * [Number] -> String
 */
var fromCharCodes = function (charCodes) {
    return String.fromCharCode.apply(String, charCodes)
};

/**
 * [Number] -> Number
 */
var fromBase = curry(function (base, nums) {
    return nums.reduce((value, num) => value * base + num, 0);
});

/**
 * Number -> Number -> Number -> [Number]
 */
var toBase = curry(function (base, digits, num) {
    let res = [];
    while (digits--) {
        res.unshift(num % base);
        num = (num / base) | 0;
    }
    return res;

/*
    // more functional-ish, but also more obscure imho
    return Array.apply(null, Array(digits)).map((__, i) => {
        if (i > 0) num = Math.floor(num / base);
        return num % base;
    }).reverse();
*/
});

/**
 * String -> String -> String -> String
 */
var surroundWith = curry(function (prefix, suffix, str) {
    return concat(concat(prefix, str), suffix);
});



export const encode = function encode(str) {
    // pad by multiple of 4
    let padBy = (4 - (str.length % 4)) % 4;

    return pipe (
        padRight('\0', padBy),          // String -> String (pad with null bytes)
        toCharCodes,                    // String -> [Number] (convert to array of ASCII codes)
        splitEvery(4),                  // [Number] -> [[Number]] (group into blocks of 4)
        map (                           // for each block:
            pipe (
                fromBase(256),          // [Number] -> Number (convert to a single number, treating each value as base 256 number)
                toBase(85, 5),          // Number -> [Number] (convert number to 5 base 85 digits)
                map(add(33)),           // [Number] -> [Number] (map over block and add 33 to every number)
                fromCharCodes           // [Number] -> String (convert block of ASCII codes to an ASCII string)
            )
        ),
        join(''),                       // [String] -> String (join the string blocks)
        removeRight(padBy),             // String -> String (remove padding)
        replace(/!!!!!/g, 'z'),         // String -> String (compress null bytes)
        surroundWith('<~', '~>')        // String -> String (surround with markers)
    )(str);
};

export const decode = function decode(str) {
    // prepare input string
    let input = pipe (
        replace(/^<~|~>$|\s/g, ''),     // String -> String (remove markers and whitespaces)
        replace(/z/g, '!!!!!')          // String -> String (expand compressed null bytes)
    )(str);

    // pad by multiple of 5
    let padBy = (5 - (input.length % 5)) % 5;

    return pipe (
        padRight('u', padBy),           // String -> String (pad with u's)
        toCharCodes,                    // String -> [Number] (convert to array of ASCII codes)
        splitEvery(5),                  // [Number] -> [[Number]] (group into blocks of 5)
        map (                           // for each block:
            pipe (
                map(add(-33)),          // [Number] -> [Number] (map over the block and subtract 33 from every number)
                fromBase(85),           // [Number] -> Number (convert to number)
                toBase(256, 4),         // Number -> [Number] (convert number to 4 base 256 digits)
                fromCharCodes           // [Number] -> String (convert to string)
            )
        ),
        join(''),                       // [String] -> String (join blocks of strings)
        removeRight(padBy)              // String -> String (remove padding)
    )(input);
};
