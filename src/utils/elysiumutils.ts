import { mod } from "./utils";
import * as npath from "path";

export const noteArray: string[] = [
    "C", // 0
    "C#", // 1
    "D", // 2
    "D#", // 3
    "E", // 4
    "F", // 5
    "F#", // 6 
    "G", // 7
    "G#", // 8
    "A", // 9
    "A#", // 10
    "B", // 11
];

export function getNoteParts(note: string): { name: string, octave: number }
{
    if (note[1] === "#")
    {
        return {
            name: note.substr(0, 2),
            octave: parseInt(note.substr(2))
        };
    }
    else
    {
        return {
            name: note.substr(0, 1),
            octave: parseInt(note.substr(1))
        };
    }
}

export function transposeNote(note: string, transpose: number)
{
    const { octave, name } = getNoteParts(note);

    const noteIndex = noteArray.indexOf(name);
    const newNoteIndex = mod(noteIndex + transpose, 12);
    const octaveDelta = Math.floor((transpose + noteIndex) / 12);

    // console.log(note, transpose, noteArray[newNoteIndex] + (octave + octaveDelta).toString());
    return noteArray[newNoteIndex] + (octave + octaveDelta).toString();
}

export function noteFromIndex(index: number): string
{
    return noteArray[index % noteArray.length] + Math.floor(index / noteArray.length).toString();
}

export function indexFromNote(note: string): number
{
    const { octave, name } = getNoteParts(note);

    return noteArray.length * octave + noteArray.indexOf(name);
}

