import * as _ from "lodash";

const numbers = _.range(10);
const upperCaseLetters = _.range(65, 91).map((n) => String.fromCharCode(n));
const lowerCaseLetters = _.range(97, 123).map((n) => String.fromCharCode(n));

const allCharacters = [...numbers, ...upperCaseLetters, ...lowerCaseLetters];

const code = _.range(10)
  .map(() => allCharacters[_.random(0, allCharacters.length - 1)])
  .join("");

console.log(code);
