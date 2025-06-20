import { createRef, Component, h } from "preact";
import * as _ from "lodash";
import * as mathjs from "mathjs";

import * as calculate from "../calculate";
import { Note } from "../../../shared/types";
import style from "../styles/CalculationsColumn.module.scss";
import { Props as NoteListProps } from "./NoteList";
import NoteList from "./NoteList";
import * as localSettings from "../localSettings";
import { MathValue } from "../types";

interface Props {
  note: Note;
  textareaFocussed: boolean;
  autoFocus: "title" | "body" | undefined;
  isMobile: boolean;
  calculationResult: ReturnType<typeof calculate.calculate>;

  renameSelectedNote: (title: string) => void;
  deleteNote: () => void;
  editSelectedNoteBody: (body: string, callback?: () => void) => void;
  setTextareaFocussed: (focussed: boolean) => void;

  // XXX This is so hacky!! Think about using redux or similar global state instead
  propsForNoteList: NoteListProps;
}

interface Suggestion {
  type: string;
  suggestion: string;
}

interface State {
  dropdownVisible: boolean;

  caretPosition?: {
    x: number;
    y: number;
  };
  wordAtCaretPrefix?: string;

  suggestions?: {
    list: Suggestion[];
    selectedIndex: number;
  };

  lastInteractionWasADeletion: boolean;
}

// XXX could be a FunctionComponent
class CalculationsColumn extends Component<Props, State> {
  textareaRef = createRef<HTMLTextAreaElement>();

  constructor(props: Props) {
    super(props);
    this.state = { dropdownVisible: false, lastInteractionWasADeletion: false };
  }

  renderList() {}

  previousAnswerLines: string[] = [];

  suggestionsVisible() {
    const { caretPosition, wordAtCaretPrefix, suggestions } = this.state;
    return caretPosition !== undefined && wordAtCaretPrefix && suggestions;
  }

  elideText(text: string, maxLength: number = 16) {
    if (text.length > maxLength) {
      return <span title={text}>{text.substring(0, maxLength - 3)}...</span>;
    }
    return text;
  }

  render() {
    const {
      note,
      textareaFocussed,
      autoFocus,
      isMobile,
      calculationResult: { overlayLines, answerLines, scope },
      renameSelectedNote,
      deleteNote,
      editSelectedNoteBody,
      setTextareaFocussed,
      propsForNoteList,
    } = this.props;

    const { caretPosition, wordAtCaretPrefix, suggestions } = this.state;
    const bodyLines = note.body.split("\n");

    const selectedWord: { start: number; end: number } | undefined = (() => {
      if (caretPosition && wordAtCaretPrefix) {
        // Figure out whole word around caretPosition, this is necessary to ensure that we don't
        // break the word up onto multiple lines when doing text reflow (wrapping)
        const caretLine = bodyLines[caretPosition.y];

        if (caretLine[caretPosition.x - 1] === " ") {
          // Not within a word
          return undefined;
        }

        // Add preceding characters
        let start = caretPosition.x;
        while (start - 1 >= 0 && caretLine[start - 1] !== " ") {
          start -= 1;
        }

        // Add subsequent characters
        let end = caretPosition.x;
        while (end + 1 < caretLine.length && caretLine[end + 1] !== " ") {
          end += 1;
        }

        return { start, end };
      }
    })();

    const darkModeClass = localSettings.darkMode() ? style["dark-mode"] : "";

    const result = (
      <div className={style["calculations-column"]}>
        <div className={style["note-header-row"]}>
          <div className={style["note-name-container"]}>
            <input
              className={[style["note-name-heading"], darkModeClass].join(" ")}
              type="text"
              value={note.title}
              autoFocus={autoFocus === "title"}
              placeholder="Type title here"
              onInput={(event) => {
                const value = event.currentTarget.value;
                renameSelectedNote(value);
              }}
            />
            {isMobile ? (
              <div className={style["note-name-dropdown-triangle-container"]}>
                <div
                  className={style["note-name-dropdown-triangle"]}
                  onClick={() =>
                    this.setState({
                      dropdownVisible: !this.state.dropdownVisible,
                    })
                  }
                >
                  ▼
                </div>
              </div>
            ) : null}
            {isMobile && this.state.dropdownVisible ? (
              <div
                className={[
                  style["dropdown"],
                  localSettings.darkMode() ? style["dark-mode"] : "",
                ].join(" ")}
              >
                <NoteList {...propsForNoteList} />
              </div>
            ) : null}
          </div>
          <a
            className={style["delete-page-button"]}
            onClick={() => {
              deleteNote();
            }}
          >
            Delete
          </a>
        </div>
        <div
          className={[
            style["calculations-container"],
            textareaFocussed ? style["calculations-container-focussed"] : "",
            darkModeClass,
          ].join(" ")}
        >
          <div className={style["calculations-inner-container"]}>
            <textarea
              spellcheck={false}
              autocapitalize="none"
              autocomplete="off"
              autocorrect="none"
              autoFocus={autoFocus === "body"}
              value={note.body}
              placeholder="Type calculations here"
              onInput={(event) => {
                const added =
                  event.currentTarget.value.length > note.body.length;
                editSelectedNoteBody(event.currentTarget.value, () => {
                  if (added) {
                    // XXX Calling setState() here before calling it immediately again in
                    // onSelectionChange() seems like an anti-pattern
                    this.setState(
                      { lastInteractionWasADeletion: false },
                      this.onSelectionChange
                    );
                  } else {
                    // If user is deleting, then don't show suggestions, otherwise it can be
                    // annoying if they are trying to delete a previous suggestion in order
                    // to enter a newline.
                    this.setState({
                      caretPosition: undefined,
                      wordAtCaretPrefix: undefined,
                      lastInteractionWasADeletion: true,
                    });
                  }
                });
              }}
              onFocus={() => setTextareaFocussed(true)}
              onBlur={() => setTextareaFocussed(false)}
              ref={this.textareaRef}
            />
            <div className={style["overlay"]}>
              {overlayLines.map((overlayLine, index) => {
                const highlightStyle = overlayLine.highlight
                  ? {
                      orange: style["highlight-orange"],
                      blue: style["highlight-blue"],
                      red: style["highlight-red"],
                      green: style["highlight-green"],
                    }[overlayLine.highlight]
                  : undefined;
                return (
                  <div
                    className={[
                      style["overlay-line"],
                      answerLines[index]?.length > 0 && !highlightStyle
                        ? style["underline"]
                        : "",
                      darkModeClass,
                      highlightStyle,
                    ].join(" ")}
                  >
                    {overlayLine.parts.map((part) => (
                      <span
                        className={[
                          {
                            invisible: style["overlay-part-hidden"],
                            variable: style["overlay-part-visible"],
                            comment: highlightStyle
                              ? style["overlay-part-comment-highlight"]
                              : style["overlay-part-comment"],
                            highlight: highlightStyle,
                          }[part.type],
                          darkModeClass,
                        ].join(" ")}
                      >
                        {part.text}
                      </span>
                    ))}
                    {answerLines[index]?.length > 0 ? (
                      <div
                        className={[
                          style["overlay-answer"],
                          this.previousAnswerLines.length > index &&
                          answerLines[index] !== this.previousAnswerLines[index]
                            ? style["answer-changed"]
                            : "",
                          localSettings.darkMode() ? style["dark-mode"] : "",
                          highlightStyle,
                        ].join(" ")}
                      >
                        =&nbsp;{this.elideText(answerLines[index])}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {this.suggestionsVisible() &&
            caretPosition !== undefined &&
            selectedWord ? (
              <div className={style["autocomplete-container"]}>
                {_.range(caretPosition.y + 1).map((index) => (
                  <div className={style["autocomplete-container-line"]}>
                    {index === caretPosition.y && suggestions ? (
                      <div>
                        {bodyLines[index].substring(0, selectedWord.start)}
                        <span className={style["selected-word"]}>
                          {bodyLines[index].substring(
                            selectedWord.start,
                            caretPosition.x
                          )}
                          <span
                            className={
                              style["autocomplete-suggestions-container"]
                            }
                          >
                            <div
                              className={[
                                style["autocomplete-suggestions"],
                                darkModeClass,
                              ].join(" ")}
                            >
                              <ul>
                                {suggestions.list.map((suggestion, index) => (
                                  <li
                                    className={[
                                      style["suggestion"],
                                      index === suggestions.selectedIndex
                                        ? style["selected-suggestion"]
                                        : "",
                                    ].join(" ")}
                                    onClick={() => {
                                      this.insertSuggestion(index);
                                    }}
                                  >
                                    {suggestion.suggestion}{" "}
                                    <span className={style["suggestion-type"]}>
                                      ({suggestion.type})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </span>
                          {bodyLines[index].substring(
                            caretPosition.x,
                            selectedWord.end
                          )}
                        </span>
                        {bodyLines[index].substring(selectedWord.end)}
                      </div>
                    ) : (
                      <div>
                        {bodyLines[index].length > 0 ? (
                          bodyLines[index]
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <div className={style["vertical-rule"]} />
          </div>
        </div>
      </div>
    );

    this.previousAnswerLines = [...answerLines];

    return result;
  }

  /** The y position of the caret the last time that the selection changed */
  lastCaretPositionY: number = -1;

  onSelectionChange = () => {
    const startRange = this.textareaRef.current?.selectionStart;
    const endRange = this.textareaRef.current?.selectionEnd;

    if (startRange === undefined || startRange !== endRange) {
      this.setState({
        caretPosition: undefined,
        wordAtCaretPrefix: undefined,
        suggestions: undefined,
      });
      this.lastCaretPositionY = -1;
      return;
    }

    const upToStart = this.props.note.body.substring(0, startRange);
    // XXX inefficient to be calculating this every time?
    const upToStartLines = upToStart.split("\n");
    const caretPositionY = upToStartLines.length - 1;

    if (this.state.lastInteractionWasADeletion) {
      // Ignore this selection change due to the deletion.
      // Reset this boolean so that the next interaction can trigger the suggestions to show.
      this.setState({ lastInteractionWasADeletion: false });
      this.lastCaretPositionY = caretPositionY;
      return;
    }

    if (/[^a-zA-Z0-9_]/.test(upToStart[upToStart.length - 1])) {
      this.setState({
        caretPosition: undefined,
        wordAtCaretPrefix: undefined,
        suggestions: undefined,
      });
      this.lastCaretPositionY = caretPositionY;
      return;
    }

    let startPosition = startRange;
    while (
      startPosition > 0 &&
      /[a-zA-Z0-9_]/.test(upToStart[startPosition - 1])
    ) {
      startPosition -= 1;
    }

    const word = upToStart.substring(startPosition);

    const suggestions: Suggestion[] = (() => {
      if (!word) {
        return [];
      }

      const candidateSuggestions: Suggestion[] = Object.keys(
        this.props.calculationResult.scope
      )
        .filter((variable) =>
          variable.toLowerCase().startsWith(word.toLowerCase())
        )
        .map((key) => ({
          type: unitDisplayString(this.props.calculationResult.scope[key]),
          suggestion: key,
        }));

      return candidateSuggestions;
    })();

    if (caretPositionY !== this.lastCaretPositionY) {
      // Don't show suggestions when moving cursor between lines
      this.setState({
        caretPosition: undefined,
        wordAtCaretPrefix: undefined,
        suggestions: undefined,
      });
      this.lastCaretPositionY = caretPositionY;
      return;
    }

    this.setState({
      caretPosition: {
        y: caretPositionY,
        x: upToStartLines[upToStartLines.length - 1].length,
      },
      wordAtCaretPrefix: word,
      suggestions:
        suggestions.length > 0
          ? {
              list: suggestions,
              selectedIndex: 0,
            }
          : undefined,
    });
  };

  componentDidMount(): void {
    document.addEventListener("selectionchange", this.onSelectionChange);
    document.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount(): void {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("selectionchange", this.onSelectionChange);
  }

  onKeyDown = (event: KeyboardEvent) => {
    const suggestions = this.state.suggestions;

    if (!this.suggestionsVisible() || !suggestions) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        if (
          suggestions.list.length < 2 ||
          suggestions.selectedIndex + 1 > suggestions.list.length - 1
        ) {
          return;
        }
        event.preventDefault();
        this.setState({
          suggestions: {
            ...suggestions,
            selectedIndex: suggestions.selectedIndex + 1,
          },
        });
        break;

      case "ArrowUp":
        if (suggestions.list.length < 2 || suggestions.selectedIndex <= 0) {
          return;
        }
        event.preventDefault();
        this.setState({
          suggestions: {
            ...suggestions,
            selectedIndex: suggestions.selectedIndex - 1,
          },
        });
        break;

      case "Enter":
        if (this.props.isMobile) {
          // Enter key for autocomplete disabled on mobile since it's annoying when you actually
          // want to move to the next line and Escape key isn't available to dismiss suggestions.
          // Tab key can be used to insert suggestions.
          break;
        }
      case "Tab":
        event.preventDefault();
        // Insert variable name at cursor position
        this.insertSuggestion(suggestions.selectedIndex);
        break;

      case "Escape":
        event.preventDefault();
        this.setState({ suggestions: undefined });
        break;
    }
  };

  insertSuggestion(selectedIndex: number) {
    const { caretPosition, wordAtCaretPrefix, suggestions } = this.state;

    if (!suggestions) {
      return;
    }

    const body = this.props.note.body;
    const bodyLines = body.split("\n");
    const suggestion = suggestions.list[selectedIndex];

    if (caretPosition && wordAtCaretPrefix) {
      const newLines = bodyLines.map((line, index) => {
        if (index === caretPosition.y) {
          return (
            line.substring(0, caretPosition.x - wordAtCaretPrefix.length) +
            suggestion.suggestion +
            line.substring(caretPosition.x)
          );
        } else {
          return line;
        }
      });

      const textarea = this.textareaRef.current;
      const newCaretIndex = (() => {
        if (!textarea) {
          return undefined;
        }
        const oldCaretPosition = textarea.selectionStart;
        const caretIndex =
          oldCaretPosition +
          suggestion.suggestion.length -
          wordAtCaretPrefix.length;

        return caretIndex;
      })();

      this.props.editSelectedNoteBody(newLines.join("\n"), () => {
        if (newCaretIndex && textarea) {
          textarea.focus();
          textarea.selectionStart = newCaretIndex;
          textarea.selectionEnd = newCaretIndex;
        }
        // XXX This timeout is hacky, better solution to ensure suggestions are hidden after
        // inserting one would be welcome. (One idea is to automatically add a space after the
        // suggestion, could try to see if it feels weird or not. I think iOS suggestions behave
        // this way)
        setTimeout(() => {
          this.setState({ suggestions: undefined });
        }, 0);
      });
    }
  }
}

const unitDisplayString = (value: MathValue | MathValue[] | mathjs.Matrix) => {
  const unit = mathjs.isUnit(value);
  if (unit) {
    return value.toJSON().unit;
  }

  const type = mathjs.typeOf(value);
  return type === "Array" ? "list" : type.toLowerCase();
};

export default CalculationsColumn;
