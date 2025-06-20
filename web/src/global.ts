// Global state. Using this lightweight solution for now until potentially switching to Redux.

interface GlobalState {
  lastSeasonVisited?: number;
  lastPhotoSetVisited?: number;
}

let state: GlobalState = {};

export const getState = () => state;

export const updateState = (update: Partial<GlobalState>) => {
  state = {
    ...state,
    ...update,
  };
};
