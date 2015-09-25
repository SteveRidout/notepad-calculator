// Note: can't use "strict mode" since we need to eval() non-strict code from the user

$(document).ready(function () {
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
		"totalCost = costPerCarton * numberOfCartons\n";

	var $inputArea = $('#inputArea'),
		$outputArea = $('#outputArea');

	var binaryOperators = {
		'+': function (a, b) {return a + b;},
		'-': function (a, b) {return a - b;},
		'/': function (a, b) {return a / b;},
		'*': function (a, b) {return a * b;}
	};
		
	var previousAnswerLines = []; // keep copy of old answers to see what changed

	var calculateAnswers = function () {
		if (!introPlaying) {
			localStorage.setItem('notePadValue', $inputArea.val());
		}

		var lines = $inputArea.val().split('\n');

		var outputLines = [];
		var context = {};

		var previousAnswerIndex;

    // Calculate answers using eval()
		$.each(lines, function (i, line) {
			try {
				// remove all comment lines
				if (line[0] && line[0] === "#") {
					line = "";
				}

				if (line.length > 0) {
          // If the line starts with an operator (+, -, *, /), prepend the previous answer
					if (binaryOperators[line[0]] && outputLines[previousAnswerIndex]) {
						line = outputLines[previousAnswerIndex] + line;
					}

          // Allow user to use 'ans' to refer to previous answer
					if (outputLines[previousAnswerIndex]) {
						line = "ans=" + outputLines[previousAnswerIndex] + ";" + line;
					}
					var answer = eval(line); // jshint ignore:line

					if (typeof(answer) === "number") {
						outputLines[i] = Math.round(answer * 10000) / 10000;
					}
					
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
			if (typeof(line) === "number") {
				row = line;
			} else {
				row = '&nbsp;';
			}

      // add "changed" class to highlight the new and changed answers since last calculation
			if (!previousAnswerLines || previousAnswerLines[index] !== outputLines[index]) {
				row = '<span class="changed">' + row + '</span>';
			}
			rows.push('<li>' + row + '</li>');
		});

		$outputArea.html(rows.join(''));
		previousAnswerLines = outputLines;
	};

	var NUM_ROWS = 50;

	$inputArea.attr('rows', NUM_ROWS);

	// Add horizontal ruler lines
	var rulerLines = [];
	for (var i = 0; i < NUM_ROWS; i++) {
		rulerLines.push('<li>&nbsp;</li>');
	}
	$('.backgroundRuler').html(rulerLines.join(''));

	$inputArea.bind('input properychange', calculateAnswers);
	
  // fetch initial calculations from localStorage
	var initialString = localStorage.getItem('notePadValue');
	if (initialString) {
		$inputArea.val(initialString);
		calculateAnswers();
		$inputArea.focus();
	} else {
    // if no inital calculations - play the intro example...
		$inputArea.val("");
		$inputArea.attr('disabled', 'disabled');
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
				var thisCharacter = initialString.slice(charIndex, charIndex + charsPerIteration);
				charIndex += charsPerIteration;

				setTimeout(function () {
					addCharacter(thisCharacter);
					printInitialLines();
				}, 20);
			} else {
				introPlaying = false;
				$inputArea.removeAttr('disabled');
				$inputArea.focus();
			}
		};

		printInitialLines();
	}
});

