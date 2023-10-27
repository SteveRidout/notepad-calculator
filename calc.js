// Note: can't use "strict mode" since we need to eval() non-strict code from the user

$(document).ready(function () { import('https://cdnjs.cloudflare.com/ajax/libs/mustache.js/4.2.0/mustache.min.js').then((Mustache) => {
  var $ = window.$;

  var exampleCalculation =
    "Edit any of the following calculations,\n" +
    "or delete them all and start from scratch!\n" +
    "\n" +
    "\n" +
    "Simple Arithmetic\n" +
    "-----------------\n" +
    "\n" +
    "How many weeks in a month?\n" +
    "52 / 12\n" +
    "\n" +
    "How many weekdays in a month?\n" +
    "* 5\n" +
    "\n" +
    "\n" +
    "Use Of Variables\n" +
    "-------------------\n" +
    "\n" +
    "costPerEgg = 1.5\n" +
    "eggsPerCarton = 6\n" +
    "costPerCarton = eggsPerCarton * costPerEgg\n" +
    "numberOfCartons = 60\n" +
    "\n" +
    "totalCost = costPerCarton * numberOfCartons\n" +
    "\n" +
    "\n" +
    "Conversions\n" +
    "-------------------\n" +
    "\n" +
    "12 cm to inches\n" +
    "2 litres to cups\n" +
    "1000 sqyard in hectares\n" +
    "5000 watts to hp\n" +
    "30 BTU in Wh\n" +
    "3 decades in minutes\n" +
    "\n" +
    "\n" +
    "Templates\n" +
    "---------\n" + 
    "\n" +
    '"Since the price of eggs is {{costPerEgg}}, and there are {{eggsPerCarton}} eggs in each carton"\n' +
    '"and since there are {{numberOfCartons}} cartons, the total cost is {{totalCost}}"';

  var $inputArea = $("#inputArea"),
    $outputArea = $("#outputArea");

  var binaryOperators = /^[\+\-\*\/]/;
  // This is not a full-blown JSON string match; if the string turns out not to be a valid string it will be picked up at parse time
  var templateString = /^\s*".*"\s*$/;

  var previousAnswerLines = []; // keep copy of old answers to see what changed

  var calculateAnswers = function () {
    if (!introPlaying) {
      localStorage.setItem("notePadValue", $inputArea.val());
    }

    var lines = $inputArea.val().split("\n");

    var outputLines = [];
    var context = {};

    var previousAnswerIndex;

    // Calculate answers using math.evaluate()
    $.each(lines, function (i, line) {
      try {
        // remove all comment lines
        if (line[0] && line[0] === "#") {
          return;
        }

        if (line.length > 0) {
          // If the line starts with an operator (+, -, *, /), prepend the previous answer
          if (
            binaryOperators.test(line[0]) &&
            outputLines[previousAnswerIndex]
          ) {
            line = "ans " + line;
          }
          if (templateString.test(line)) {
            var templateMatch = line.match(templateString);
            try {
              var templateSrc = JSON.parse(templateMatch);
            } catch(err) {
              outputLines[i] = null;
              return;
            }
            var renderedTemplate = Mustache.default.render(templateSrc, context);
            outputLines[i] = renderedTemplate;
            return;
          }

          var answer = math.evaluate(line, context);

          if (typeof answer === "number" || answer instanceof math.Unit) {
            outputLines[i] = answer;
          }

          context["ans"] = answer;

          previousAnswerIndex = i;
        } else {
          outputLines[i] = null;
        }
      } catch (err) {
        outputLines[i] = null;
      }
    });

    var rows = [];
    $.each(outputLines, function (index, line) {
      var row;
      if (line instanceof math.Unit || typeof line === "number") {
        row = math.format(line, 4);
      } else if (typeof line == 'string') {
        row = line;
      } else {
        row = "&nbsp;";
      }

      // add "changed" class to highlight the new and changed answers since last calculation
      if (
        !previousAnswerLines ||
        previousAnswerLines[index] !== outputLines[index]
      ) {
        row = '<span class="changed">' + row + "</span>";
      }
      rows.push("<li>" + row + "</li>");
    });

    $outputArea.html(rows.join(""));
    previousAnswerLines = outputLines;
  };

  var NUM_ROWS = 50;

  $inputArea.attr("rows", NUM_ROWS);

  // Add horizontal ruler lines
  var rulerLines = [];
  for (var i = 0; i < NUM_ROWS; i++) {
    rulerLines.push("<li>&nbsp;</li>");
  }
  $(".backgroundRuler").html(rulerLines.join(""));

  $inputArea.bind("input properychange", calculateAnswers);

  // fetch initial calculations from localStorage
  var initialString = localStorage.getItem("notePadValue");
  if (initialString) {
    $inputArea.val(initialString);
    calculateAnswers();
    $inputArea.focus();
  } else {
    // if no inital calculations - play the intro example...
    $inputArea.val("");
    $inputArea.attr("disabled", "disabled");
    initialString = exampleCalculation;
    var introPlaying = true;

    var addCharacter = function (character) {
      $inputArea.val($inputArea.val() + character);
      calculateAnswers();
    };

    var charIndex = 0;
    var charsPerIteration = 4;

    var printInitialLines = function () {
      if (charIndex < initialString.length) {
        var thisCharacter = initialString.slice(
          charIndex,
          charIndex + charsPerIteration
        );
        charIndex += charsPerIteration;

        setTimeout(function () {
          addCharacter(thisCharacter);
          printInitialLines();
        }, 20);
      } else {
        introPlaying = false;
        $inputArea.removeAttr("disabled");
        $inputArea.focus();
      }
    };

    printInitialLines();
  }
})});
