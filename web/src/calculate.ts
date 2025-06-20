import * as mathjs from "mathjs";

import * as localSettings from "./localSettings";
import { Scope } from "./types";

interface OverlayText {
  type: "invisible" | "variable" | "comment";
  text: string;
}

/** All the available highlight colors */
const highlightColors = [
  "orange" as const,
  "blue" as const,
  "red" as const,
  "green" as const,
];

type HighlightColor = (typeof highlightColors)[number];

interface OverlayLine {
  parts: OverlayText[];
  highlight?: HighlightColor;
}

/**
 * This returns a string containing all the matching variables from `input` with the appropriate
 * amount of whitespace in-between.
 */
const calcOverlayLine = function (input: string, scope: Scope): OverlayLine {
  let overlayParts: OverlayText[] = [];
  let lastIndex = 0;
  let match;

  const { preComment, comment } = (() => {
    const commentIndex = input.indexOf("#");
    if (commentIndex === -1) {
      // No comment
      return {
        preComment: input,
        comment: "",
      };
    }

    return {
      preComment: input.substring(0, commentIndex),
      comment: input.substring(commentIndex),
    };
  })();

  var regex = /[a-zA-Z_][a-zA-Z0-9_]*/g;

  while ((match = regex.exec(preComment)) !== null) {
    overlayParts.push({
      type: "invisible",
      text: input.substring(lastIndex, match.index),
    });
    if (match[0] in scope) {
      overlayParts.push({
        type: "variable",
        text: match[0],
      });
    } else {
      overlayParts.push({
        type: "invisible",
        text: match[0],
      });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < preComment.length) {
    overlayParts.push({
      type: "invisible",
      text: preComment.substring(lastIndex, preComment.length),
    });
  }

  if (comment.length > 0) {
    overlayParts.push({
      type: "comment",
      text: comment,
    });
  }

  const highlight: OverlayLine["highlight"] | undefined = (() => {
    const highlightRegex = new RegExp(`#.*!(${highlightColors.join("|")})$`);
    const highlightMatch = highlightRegex.exec(input);
    const highlightColor = highlightMatch
      ? (highlightMatch[1] as HighlightColor)
      : undefined;
    if (highlightColor && new Set(highlightColors).has(highlightColor)) {
      return highlightColor as OverlayLine["highlight"];
    }
    return undefined;
  })();

  return {
    parts: overlayParts,
    highlight,
  };
};

/**
 * Given an input string, this will calculate both the overlay and the contents of the answers
 * column.
 */
export const calculate = (
  input: string
  // This approach will break if wrapping lines containing variables since using blank space isn't
  // equivalent to text when it comes to wrapping.
): { overlayLines: OverlayLine[]; answerLines: string[]; scope: Scope } => {
  const binaryOperators: {
    [operator: string]: (a: number, b: number) => number;
  } = {
    "+": function (a, b) {
      return a + b;
    },
    "-": function (a, b) {
      return a - b;
    },
    "/": function (a, b) {
      return a / b;
    },
    "*": function (a, b) {
      return a * b;
    },
  };

  const lines = input.split("\n");

  const answers: (number | mathjs.Unit | undefined | mathjs.Matrix)[] = [];
  const overlayLines: OverlayLine[] = [];

  /** A block is an unbroken list of consecutive answers */
  const blocks: (number | mathjs.Unit)[][] = [];
  let withinBlock = false;

  let previousAnswerIndex: number | undefined;
  var index = -1;
  const scope: Scope = {};

  // Calculate answers using math.eval()
  for (const line of lines) {
    index++;
    let overlayLine: OverlayLine = {
      parts: [{ type: "invisible", text: line.length === 0 ? " " : line }],
    };

    // Populate 'aboveList' as appropriate within scope
    if (withinBlock && blocks.length > 1) {
      scope["above"] = blocks[blocks.length - 2];
    } else if (blocks.length > 0) {
      scope["above"] = blocks[blocks.length - 1];
    }

    if (line.length > 0) {
      // If the line starts with an operator (+, -, *, /), prepend the previous answer
      const calculation = (() => {
        if (
          binaryOperators[line.replace(/^ +/, "")[0]] &&
          previousAnswerIndex !== undefined &&
          answers[previousAnswerIndex] !== undefined
        ) {
          return answers[previousAnswerIndex] + line;
        }
        return line;
      })();

      try {
        const answer = mathjs.evaluate(calculation, scope);

        if (typeof answer === "number" || mathjs.isUnit(answer)) {
          answers[index] = answer;
          scope.ans = answer;
          previousAnswerIndex = index;

          // Add to block
          if (withinBlock) {
            blocks[blocks.length - 1].push(answer);
          } else {
            blocks.push([answer]);
            withinBlock = true;
          }
        } else {
          withinBlock = false;
        }

        if (mathjs.isArray(answer) || mathjs.isMatrix(answer)) {
          // Clone answer in case it's an array or other type which could be mutated
          answers[index] = mathjs.clone(answer) as any;
          scope.ans = answer;
        }

        overlayLine = calcOverlayLine(line, scope);
        overlayLines.push(overlayLine);
      } catch (error) {
        withinBlock = false;
        answers[index] = undefined;
        overlayLine = calcOverlayLine(line, scope);
        overlayLines.push(overlayLine);
      }
    } else {
      withinBlock = false;
      answers[index] = undefined;
      overlayLines.push(overlayLine);
    }
  }

  return {
    overlayLines,
    answerLines: answers.map((answer) => {
      if (answer === undefined) {
        return "";
      }

      const localeOverride = localSettings.locale();

      return mathjs.format(answer, (value) => {
        if (
          (Math.abs(value) < 0.0001 || Math.abs(value) > 1e12) &&
          value !== 0
        ) {
          return value.toLocaleString(localeOverride, {
            maximumFractionDigits: 7,
            notation: "scientific",
          });
        }

        return value.toLocaleString(localeOverride, {
          maximumFractionDigits: 6,
        });
      });
    }),
    scope,
  };
};
