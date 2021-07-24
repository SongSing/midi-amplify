import App from "./App";
import React, { useReducer, FunctionComponent } from "react";
import { array_remove, array_remove_at, boolToSort, capitalize, filesFromDirectoryR, getUserDataPath, objectWithoutKeys } from "./utils/utils";
import { SafeWriter } from "./utils/safewriter";
import * as path from "path";
import * as fs from "fs";
import { MidiDevice, MidiNote } from "./utils/midi";
import { Provider } from "react-redux";
import { configureStore, AnyAction, createAction } from '@reduxjs/toolkit'

export interface AppSettings
{
    isFirstRun: boolean;
    midiInputs: string[];
    midiOutputs: string[];
    amplify: number;
}

export interface AppState
{
    settings: AppSettings;
    allowedOutputs: MidiDevice[];
    allowedInputs: MidiDevice[];
    notes: MidiNote[];
}

export const initialSettings : AppSettings = {
    isFirstRun: true,
    midiInputs: [],
    midiOutputs: [],
    amplify: 0
};

const initialState : AppState = {
    settings: initialSettings,
    allowedOutputs: [],
    allowedInputs: [],
    notes: [],
};

export function saveSettings(settings: AppSettings)
{
    const savingSettings: AppSettings = {...initialSettings};
    for (const key in initialSettings)
    {
        if (Object.prototype.hasOwnProperty.call(settings, key))
        {
            (savingSettings as any)[key] = (settings as any)[key];
        }
    }

    SafeWriter.write(path.join(getUserDataPath(), "settings.json"), JSON.stringify(settings));
}

export function loadSettings(): AppSettings
{
    const newSettings: AppSettings = {...initialSettings};
    let loadedSettings: AppSettings = {...initialSettings};

    try
    {
        loadedSettings = JSON.parse(fs.readFileSync(path.join(getUserDataPath(), "settings.json"), "utf8"));
    }
    catch
    {
        // whatever i didnt want to load them anyway
    }
    
    for (const key in initialSettings)
    {
        if (Object.prototype.hasOwnProperty.call(loadedSettings, key))
        {
            (newSettings as any)[key] = (loadedSettings as any)[key];
        }
    }

    return newSettings;
}

export const setSettings = createAction<AppSettings>("setSettings");
export const setFirstRunFalse = createAction("setFirstRunFalse");
export const setAllowedInputs = createAction<MidiDevice[]>("setAllowedInputs");
export const setAllowedOutputs = createAction<MidiDevice[]>("setAllowedOutputs");
export const setEnabledInputs = createAction<string[]>("setEnabledInputs");
export const setEnabledOutputs = createAction<string[]>("setEnabledOutputs");
export const setAmplify = createAction<number>("setAmplify");
export const setNotes = createAction<MidiNote[]>("setNotes");

const reducer = (state = initialState, action: AnyAction): AppState =>
{
    if (setAllowedInputs.match(action))
    {
        return {
            ...state,
            allowedInputs: action.payload
        };
    }
    else if (setAllowedOutputs.match(action))
    {
        return {
            ...state,
            allowedOutputs: action.payload
        };
    }
    else if (setEnabledOutputs.match(action))
    {
        return {
            ...state,
            settings: {
                ...state.settings,
                midiOutputs: action.payload
            }
        };
    }
    else if (setEnabledInputs.match(action))
    {
        return {
            ...state,
            settings: {
                ...state.settings,
                midiInputs: action.payload
            }
        };
    }
    else if (setSettings.match(action))
    {
        return {
            ...state,
            settings: action.payload
        };
    }
    else if (setFirstRunFalse.match(action))
    {
        return {
            ...state,
            settings: {
                ...state.settings,
                isFirstRun: false
            }
        };
    }
    else if (setAmplify.match(action))
    {
        return {
            ...state,
            settings: {
                ...state.settings,
                amplify: action.payload
            }
        };
    }
    else if (setNotes.match(action))
    {
        return {
            ...state,
            notes: action.payload
        };
    }

    return state;
};

const store = configureStore({
  reducer,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const AppContextProvider: FunctionComponent = () =>
{
    return (
        <Provider store={store}>
            <App />
        </Provider>
    )
};