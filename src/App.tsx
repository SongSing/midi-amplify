import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './App.global.scss';
import { loadSettings, saveSettings, setAllowedInputs, setAllowedOutputs, setAmplify, setEnabledInputs, setEnabledOutputs, setFirstRunFalse, setNotes, setSettings } from './AppContext';
import {  makeUserDataPath } from './utils/utils';
import { ipcRenderer, remote, webFrame } from 'electron';
import Midi from './utils/midi';
import { useAppDispatch, useAppSelector } from "./hooks/reduxHooks";
import NumberInput from './Components/NumberInput';
import { noteFromIndex } from './utils/elysiumutils';

const noteNumbers = Array(128).fill(0).map((_, i) => i);

export default function App() {
    const dispatch = useAppDispatch();
    const enabledInputs = useAppSelector(s => s.settings.midiInputs);
    const enabledOutputs = useAppSelector(s => s.settings.midiOutputs);
    const allowedInputs = useAppSelector(s => s.allowedInputs);
    const allowedOutputs = useAppSelector(s => s.allowedOutputs);
    const amplify = useAppSelector(s => s.settings.amplify);
    const notes = useAppSelector(s => s.notes);
    const settings = useAppSelector(s => s.settings);

    useLayoutEffect(() =>
    {
        makeUserDataPath();
        const settings = loadSettings();

        dispatch(setSettings(settings));

        if (settings.isFirstRun)
        {
            dispatch(setFirstRunFalse());
        }

        function showAbout()
        {
            remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                message: "MIDI Amplifier by Mina Kemp\n\nIcon from https://icons8.com/\n\nHave a nice day :)",
                buttons: [ "Thanks" ],
                noLink: true,
                title: "About",
                defaultId: 0,
                type: "info"
            });
        }

        ipcRenderer.addListener("showAbout", showAbout);

        Midi.init();

        return () =>
        {
            ipcRenderer.removeListener("showAbout", showAbout);
        };
    }, []);

    useEffect(() =>
    {
        Midi.onOutputsChanged = (outputs) =>
        {
            dispatch(setAllowedOutputs(outputs));
        };
        Midi.onInputsChanged = (inputs) =>
        {
            dispatch(setAllowedInputs(inputs));
        };
        Midi.onNotesChanged = (notes) =>
        {
            dispatch(setNotes(notes));
        };
        Midi.onNoteOn = (note) =>
        {
            Midi.noteOn([note.name], enabledOutputs, 1, {
                velocity: Math.max(0, Math.min(note.velocity + amplify, 127))
            });
        };
        Midi.onNoteOff = (note) =>
        {
            Midi.noteOff([note.name], enabledOutputs, 1, {
                release: note.release
            });
        };

        function save()
        {
            saveSettings(settings);
        }

        window.addEventListener("beforeunload", save);

        return () =>
        {
            Midi.onOutputsChanged = null;
            Midi.onInputsChanged = null;
            Midi.onNotesChanged = null;
            Midi.onNoteOn = null;
            Midi.onNoteOff = null;
            window.removeEventListener("beforeunload", save);
        };
    });

    useEffect(() =>
    {
        Midi.setEnabledInputs(enabledInputs);
        saveSettings(settings);
    }, [enabledInputs]);

    useEffect(() =>
    {
        Midi.setEnabledOutputs(enabledOutputs);
        saveSettings(settings);
    }, [enabledOutputs]);

    function toggleEnabledInput(name: string)
    {
        if (enabledInputs.includes(name))
        {
            dispatch(setEnabledInputs(enabledInputs.filter(n => n !== name)));
        }
        else
        {
            dispatch(setEnabledInputs(enabledInputs.concat([ name ])));
        }
    }

    function toggleEnabledOutput(name: string)
    {
        if (enabledOutputs.includes(name))
        {
            dispatch(setEnabledOutputs(enabledOutputs.filter(n => n !== name)));
        }
        else
        {
            dispatch(setEnabledOutputs(enabledOutputs.concat([ name ])));
        }
    }

    function handleAmplifyChange(amplify: number)
    {
        dispatch(setAmplify(amplify));
    }

    let runningX = 0;

    return (
        <div className="app">
            <div className="row topRow">
                <div className="midis">
                    <h1>MIDI Inputs</h1>
                    <div className="midiList">
                        {allowedInputs.map(input => <label className="clicky" key={input.id}>
                            <input
                                key={input.id}
                                type="checkbox"
                                checked={enabledInputs.includes(input.name)}
                                onChange={_ => toggleEnabledInput(input.name)}
                            />
                            <span>
                                {input.name}
                            </span>
                        </label>)}
                    </div>
                </div>
                <div className="midis">
                    <h1>MIDI Outputs</h1>
                    <div className="midiList">
                        {allowedOutputs.map(output => <label className="clicky" key={output.id}>
                            <input
                                key={output.id}
                                type="checkbox"
                                checked={enabledOutputs.includes(output.name)}
                                onChange={_ => toggleEnabledOutput(output.name)}
                            />
                            <span>
                                {output.name}
                            </span>
                        </label>)}
                    </div>
                </div>
                <div className="amplify">
                    <h1>Amplify</h1>
                    <NumberInput
                        onChange={handleAmplifyChange}
                        value={amplify}
                        coerce={Math.floor}
                        max={127}
                        min={-127}
                        step={1}
                    />
                    <input
                        type="range"
                        min={-127}
                        max={127}
                        value={amplify}
                        onChange={e => handleAmplifyChange(Math.round(parseFloat(e.currentTarget.value)))}
                    />
                </div>
                <div className="notes">
                    <h1>Notes</h1>
                    <div className="noteList">
                    {notes.filter(note => note.isOn).map((note) => (
                        <div className="note" key={note.number}>
                            {note.name} {note.velocity}-&gt;{Math.max(0, Math.min(note.velocity + amplify, 127))}
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <div className="piano">
                {noteNumbers.map((num) =>
                {
                    const isBlack = noteFromIndex(num).includes("#");
                    const playedNote = notes.find(n => n.number === num && n.isOn);
                    const ret = (
                        <div
                            className={"pianoKey " + (isBlack ? "black" : "")}
                            key={num}
                            style={{
                                left: `calc(${runningX / 75 * 100}% - ${isBlack ? 1 / 225 * 100 : 0}%)`,
                                backgroundColor: playedNote ? `rgba(255,${200 - playedNote.velocity * 1.5},${200 - playedNote.velocity * 1.5},1)` : ""
                            }}
                        >
                        </div>
                    );

                    runningX += +!isBlack;

                    return ret;
                })}
            </div>
        </div>
    );
}
