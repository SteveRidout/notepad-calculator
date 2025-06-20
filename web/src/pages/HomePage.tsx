import { Component, h } from "preact";

import { Note, User } from "../../../shared/types";
import style from "../styles/HomePage.module.scss";
import localNoteStorage from "../localNoteStorage";
import { remoteNoteStorage } from "../api";
import { NoteStorageAPI } from "../types";
import * as utils from "../utils";
import * as config from "../config";
import CalculationsColumn from "../components/CalculationsColumn";
import NoteList from "../components/NoteList";
import * as legacyLocalStorage from "../legacyLocalStorage";
import * as calculate from "../calculate";

interface Props {
  user: User | undefined;
  noteId?: string;
  isMobile: boolean;
}

type State =
  | {
      type: "loading";
    }
  | {
      type: "loaded";

      autoFocus: "title" | "body" | undefined;

      notes: { [id: number]: Note };

      // This is the order the notes will appear in the app
      noteIds: number[];

      selectedNoteId: number;

      textareaFocussed: boolean;

      selectedNoteCalculationResult: ReturnType<typeof calculate.calculate>;
    };

const welcomeNoteData: { title: string; body: string }[] = [config.exampleNote];

class HomePage extends Component<Props, State> {
  noteStorage: NoteStorageAPI;

  debouncer = new utils.MultiDebouncer(400);

  constructor(props: Props) {
    super(props);
    this.state = { type: "loading" };

    if (props.user === undefined) {
      this.noteStorage = localNoteStorage;
    } else {
      this.noteStorage = remoteNoteStorage;
    }

    this.load();
  }

  async load() {
    let noteIds = await this.noteStorage.listNoteIds();

    const noteId = this.props.noteId
      ? parseInt(this.props.noteId, 10)
      : undefined;

    if (noteIds.length === 0) {
      console.log("setting default example state");
      const notes: { [id: number]: Note } = {};
      const noteIds: number[] = [];

      const legacyNote = legacyLocalStorage.getValue();

      const initialNoteData: typeof welcomeNoteData = legacyNote
        ? [
            {
              title: "My Note",
              body: legacyNote,
            },
          ]
        : welcomeNoteData;

      // Save example notes
      for (const { title, body } of initialNoteData) {
        console.log("saving note: ", title);
        const note = await this.noteStorage.saveNote({
          title,
          body,
        });
        console.log("saved note: ", title);
        notes[note.id] = note;
        noteIds.push(note.id);
      }

      if (!legacyNote) {
        // Set notes to not-dirty if they are just the default welcome message
        await this.noteStorage.setDirty?.(false);
      }

      const selectedNoteId =
        noteId !== undefined && notes[noteId] !== undefined
          ? noteId
          : noteIds[0];

      this.setState({
        type: "loaded",
        notes: notes,
        noteIds: noteIds,
        selectedNoteId,
        autoFocus: undefined,
        textareaFocussed: false,
        selectedNoteCalculationResult: calculate.calculate(
          notes[selectedNoteId].body
        ),
      });
    } else {
      const selectedNoteName = noteIds[0];

      if (selectedNoteName === undefined) {
        throw Error("Unexpected state");
      }

      // Fetch all notes
      const notes: { [noteId: number]: Note } = {};

      const fetchedNotes = await Promise.all(
        noteIds.map(async (noteId) => {
          try {
            return await this.noteStorage.getNote(noteId);
          } catch (error) {
            console.error("failed to fetch note: ", noteId, " skipping");

            // Remove from noteIds
            noteIds = noteIds.filter((thisNoteId) => thisNoteId !== noteId);

            return undefined;
          }
        })
      );

      for (const note of fetchedNotes) {
        if (note) {
          notes[note.id] = note;
        } else {
          continue;
        }
      }

      const selectedNoteId =
        noteId !== undefined && notes[noteId] !== undefined
          ? noteId
          : noteIds[0];
      const selectedNote = notes[selectedNoteId];

      this.setState({
        type: "loaded",
        notes,
        noteIds,
        selectedNoteId,
        autoFocus: selectedNote.title === "" ? "title" : "body",
        textareaFocussed: false,
        selectedNoteCalculationResult: calculate.calculate(
          notes[selectedNoteId].body
        ),
      });
    }
  }

  initSelectedNote() {
    if (this.state.type !== "loaded") {
      throw Error("Unexpected state");
    }

    const { selectedNoteId, notes } = this.state;

    if (!this.props.noteId) {
      // Set the pathname??
      return;
    }

    const id = parseInt(this.props.noteId, 10);
    if (id !== selectedNoteId && notes[id]) {
      this.setState({ ...this.state, selectedNoteId: id });
    }
  }

  renameSelectedNote(newTitle: string) {
    if (this.state.type !== "loaded") {
      throw Error("Unexpected state");
    }

    const { notes, selectedNoteId } = this.state;

    // Change the selected note name
    this.setState({
      ...this.state,
      notes: {
        ...notes,
        [selectedNoteId]: {
          ...notes[selectedNoteId],
          title: newTitle,
        },
      },
    });

    this.saveUpdatedNote(selectedNoteId, { title: newTitle });
  }

  async addNewNote() {
    const newNoteTitle = "";

    if (this.state.type !== "loaded") {
      throw Error("Unexpected state");
    }

    const { notes, noteIds } = this.state;

    const body = "";

    const note = await this.noteStorage.saveNote({
      title: newNoteTitle,
      body,
    });

    this.setState({
      ...this.state,
      notes: { ...notes, [note.id]: note },
      noteIds: [...noteIds, note.id],
      selectedNoteId: note.id,
      selectedNoteCalculationResult: calculate.calculate(body),
      autoFocus: "title",
    });

    // XXX Would be nice to auto-highlight the note name editor now, and then after that to
    // auto highlight the note body editor
  }

  deleteNote() {
    if (!confirm("Are you sure you want to permanently delete this note?")) {
      return;
    }

    if (this.state.type !== "loaded") {
      throw Error("Unexpected state");
    }

    const { notes, noteIds, selectedNoteId } = this.state;

    const newNotes = { ...notes };
    delete newNotes[selectedNoteId];

    const previousIndex = noteIds.indexOf(selectedNoteId);

    const newSelectedNoteId = noteIds[Math.max(0, previousIndex - 1)];

    this.setState({
      ...this.state,
      notes: newNotes,
      noteIds: noteIds.filter((id) => id !== selectedNoteId),
      selectedNoteId: newSelectedNoteId,
      selectedNoteCalculationResult:
        noteIds.length > 0
          ? calculate.calculate(this.state.notes[newSelectedNoteId].body)
          : undefined,
    });

    this.noteStorage.deleteNote(selectedNoteId);
  }

  saveUpdatedNote(noteId: number, update: { title?: string; body?: string }) {
    this.debouncer.call(() => {
      this.noteStorage.updateNote(noteId, update);
    }, [noteId, update.title !== undefined, update.body !== undefined].join("-"));
  }

  editSelectedNoteBody = (body: string, callback?: () => void) => {
    if (this.state.type !== "loaded") {
      throw Error("Unexpected state");
    }

    const { notes, selectedNoteId } = this.state;

    this.setState(
      {
        notes: {
          ...this.state.notes,
          [this.state.selectedNoteId]: {
            ...notes[selectedNoteId],
            body,
          },
        },
        selectedNoteCalculationResult: calculate.calculate(body),
      },
      callback
    );

    this.saveUpdatedNote(selectedNoteId, { body });
  };

  selectNote(noteId: number) {
    if (this.state.type !== "loaded") {
      throw Error("Unexpected state: Not loaded");
    }

    this.setState({
      ...this.state,
      selectedNoteId: noteId,
      selectedNoteCalculationResult: calculate.calculate(
        this.state.notes[noteId].body
      ),
    });
  }

  render() {
    if (this.state.type === "loading") {
      return <div className={style["main-container"]}>Loading...</div>;
    }

    const isMobile = this.props.isMobile;
    const { notes, noteIds, selectedNoteId, selectedNoteCalculationResult } =
      this.state;

    const note = notes[selectedNoteId];

    return (
      <div className={style["main-container"]}>
        {isMobile ? null : (
          <div className={style["note-list-column"]}>
            <NoteList
              noteIds={noteIds}
              selectedNoteId={selectedNoteId}
              notes={notes}
              selectNote={(noteId) => this.selectNote(noteId)}
              addNote={() => this.addNewNote()}
            />
          </div>
        )}
        {note ? (
          <CalculationsColumn
            key={selectedNoteId}
            note={note}
            textareaFocussed={this.state.textareaFocussed}
            autoFocus={this.state.autoFocus}
            renameSelectedNote={(title) => this.renameSelectedNote(title)}
            deleteNote={() => this.deleteNote()}
            editSelectedNoteBody={this.editSelectedNoteBody}
            setTextareaFocussed={(focussed) =>
              this.setState({ ...this.state, textareaFocussed: focussed })
            }
            propsForNoteList={{
              noteIds: noteIds,
              selectedNoteId: selectedNoteId,
              notes: notes,
              selectNote: (noteId) => this.selectNote(noteId),
              addNote: () => this.addNewNote(),
            }}
            isMobile={isMobile}
            calculationResult={selectedNoteCalculationResult}
          />
        ) : (
          <div className={style["add-notes-hint"]}>
            {isMobile ? (
              <a onClick={() => this.addNewNote()}>Click to add a New Note</a>
            ) : (
              <span>
                ← Click on "<strong>+ New Note</strong>" to add a new page of
                notes
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  changeSelectedNote(delta: number) {
    if (this.state.type !== "loaded") {
      throw Error("Unexpected state");
    }

    const { noteIds, selectedNoteId } = this.state;
    const selectedNoteIndex = noteIds.indexOf(selectedNoteId);
    const newIndex = Math.min(
      noteIds.length - 1,
      Math.max(0, selectedNoteIndex + delta)
    );

    this.setState({
      ...this.state,
      selectedNoteId: noteIds[newIndex],
      // XXX This doesn't seem to be working :-(
      // Maybe something to do with being within a keyboard interaction??
      autoFocus: "body",
      selectedNoteCalculationResult: calculate.calculate(
        this.state.notes[newIndex].body
      ),
    });
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowUp" && event.altKey) {
      this.changeSelectedNote(-1);
    }
    if (event.key === "ArrowDown" && event.altKey) {
      this.changeSelectedNote(+1);
    }
  };

  componentDidMount(): void {
    // Set up keyboard handler
    document.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount(): void {
    document.removeEventListener("keydown", this.onKeyDown);
  }

  componentDidUpdate(): void {
    if (this.state.type !== "loaded") {
      return;
    }

    if (this.props.user === undefined) {
      // Don't set path when in local mode
      return;
    }

    // XXX Feels like breaking abstraction layer to do this here
    const currentPathNoteId = (() => {
      const splitPath = location.pathname.split("/");
      if (splitPath[1] === "notes" && splitPath[2]) {
        return parseInt(splitPath[2], 10);
      }
    })();

    if (currentPathNoteId !== this.state.selectedNoteId) {
      if (this.state.selectedNoteId === undefined) {
        history.pushState({}, "", "/");
      } else {
        history.pushState({}, "", `/notes/${this.state.selectedNoteId}`);
      }
    }
  }
}

export default HomePage;
