import './App.css';
// useRef
import { useEffect, useState } from 'react';
import db from './db';

// util tools
function str2color(text) {
	// text 2 random color, in rgba
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		hash = text.charCodeAt(i) + ((hash << 5) - hash);
	}
	let color = '#';
	for (let i = 0; i < 3; i++) {
		let value = (hash >> (i * 8)) & 0xFF;
		color += ('00' + value.toString(16)).substr(-2);
	}
	return color + '80';
}

function App() {
	// ---------------- init ----------------
	let [inputValue, setInputValue] = useState('');
	let [lines, setLines] = useState([]);
	let [recentNotes, setRecentNotes] = useState([]);
	let [currrentNote, setCurrentNote] = useState('');

	useEffect(() => {
		async function init() {
			// init if needed
			let count = await db.notes.count();
			if (count === 0) {
				await db.notes.add({ name: 'think', time: Date.now(), content: [] });
			}

			db.notes.orderBy('time').reverse().first().then(note => {
				db.notes.orderBy('time').reverse().toArray().then(notes => {
					setRecentNotes(notes.map(note => note.name));
				})
				setCurrentNote(note.name);
				setLines(note.content);
			})
		}
		init();
	}, []);


	// ---------------- input event ----------------
	const handleInputChange = (event) => {
		setInputValue(event.target.value);
	};

	const handleEnterKey = async (event) => {
		if (event.key === 'Enter' && inputValue.trim() !== '') {
			// 'delnote' to delete note
			if (inputValue.trim() === 'delnote') {
				// cant delete last note
				let count = await db.notes.count();
				if (count === 1) return

				// update db
				db.notes.delete(currrentNote);

				// update recentNotes
				let newRecentNotes = recentNotes.filter(name => name !== currrentNote);
				setRecentNotes(newRecentNotes);
				let noteName = newRecentNotes[0];

				// update currentNote
				let note = await db.notes.get(noteName);
				setCurrentNote(noteName);
				setLines(note.content);
				setInputValue('');
				return;
			}

			// if content == 'del', del first line
			let newLines;
			if (inputValue.trim() === 'del') {
				newLines = [...lines];
				newLines.shift();
			} else {
				newLines = [{ text: inputValue, time: Date.now() }, ...lines].slice(0, 1000);
			}
			setLines(newLines);
			setInputValue('');
			db.notes.update(currrentNote, { content: newLines, time: Date.now() });
			setRecentNotes([currrentNote, ...recentNotes.filter(name => name !== currrentNote)]);
		}
	};

	async function changeNote(noteName) {
		// if 'add', add new note
		if (noteName === 'add') {
			let noteName = prompt('note name');
			if (noteName) {
				// update db
				db.notes.add({ name: noteName, time: Date.now(), content: [] });

				// update recentNotes
				setRecentNotes([noteName, ...recentNotes]);

				// update currentNote
				setCurrentNote(noteName);
				setLines([]);
				setInputValue('');
			}
			return
		}


		let note = await db.notes.get(noteName);
		setCurrentNote(noteName);
		setLines(note.content);
	}


	//-------------------------------- Main --------------------------------

	return (
		<div
			className="bg-zinc-900 text-white w-screen overflow-y-auto"
			style={{ backgroundColor: str2color(currrentNote).substring(0, 7) + '40' }}
		>
			<div>
				{recentNotes.map((noteName, index) => (
					<div
						key={index}
						onClick={() => changeNote(noteName)}
						style={{ backgroundColor: str2color(noteName) }}
						className="px-3 py-2 m-0 border border-gray-700 cursor-pointer rounded inline-block"
					>{noteName}</div>
				))}
				<div
					onClick={() => changeNote('add')}
					style={{ backgroundColor: str2color('add') }}
					className="px-3 py-2 m-0 border border-gray-700 cursor-pointer rounded inline-block"
				>+</div>
			</div>
			<input
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onKeyUp={handleEnterKey}
				style={{ backgroundColor: str2color(currrentNote).substring(0, 7) + '75' }}
				className="text-white p-2 mb-0 border border-gray-700 w-full focus:border-transparent focus:outline-none"
				autoFocus={true}
			/>
			<div>
				{lines.map((line, index) => (
					<div key={index} className="flex flex-col items-start">
						{
							(index == 0) &&
							// show date like '1-27', month-day
							<p className="text-gray-400 text-center w-full rounded-lg bg-zinc-900 p-1 text-xs">{`${new Date(line.time).getMonth() + 1}-${new Date(line.time).getDate()}`}</p>
						}
						<div
							className="p-2 w-full border-gray-700 border-b-2"
							style={{ backgroundColor: str2color(currrentNote).substring(0, 7) + '20' }}
						>{line.text}</div>
						{
							// date not match
							(index < lines.length - 1) && (new Date(lines[index + 1].time).toLocaleDateString() !== new Date(line.time).toLocaleDateString()) &&
							<p className="text-gray-400 text-center w-full rounded-lg bg-zinc-900 p-1 text-xs">{`${new Date(lines[index+1].time).getMonth() + 1}-${new Date(lines[index+1].time).getDate()}`}</p>
						}
					</div>
				))}
			</div>
		</div>
	)
}

export default App;
