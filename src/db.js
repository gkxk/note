import Dexie  from 'dexie';

class NoteDB extends Dexie {
	constructor() {
		super('NoteDB');
		this.version(1).stores({
			notes: 'name,time,content',
		});
	}
}
const db=new NoteDB();
export default db;