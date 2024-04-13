import { Injectable } from '@angular/core';
import { Todo } from './todo';
import PouchDB from 'pouchdb';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  localDB: any;
  todos: Todo[];
  
  constructor() { }

  initDB() {
    this.localDB = new PouchDB('todo');
    const remoteUrl = "";
    const remoteDB = new PouchDB(remoteUrl, {
      fetch: (url: string | Request, opts: any) => {
        const login = "";
        const password = "";
        const token = btoa(login + ":" + password);
        opts.headers.set('Authorization', 'Basic ' + token);
        return PouchDB.fetch(url, opts);
      }
    });

    this.localDB.sync(remoteDB, {
      live: true,
      retry: false
    });
  }

  private findIndex(id: string) {
    const todoIndex = this.todos.findIndex(todo => todo._id === id);
    return todoIndex;
  }

  private onDatabaseChange = (change: any) => {
    const index = this.findIndex(change.id);
    const todo = this.todos[index];
    if(change.deleted) {
      if(todo) {
        this.todos.splice(index, 1);
      }
    } else {
      if(todo && todo._id === change.id) {
        this.todos[index] = change.doc;
      } else {
        this.todos.splice(index, 0, change.doc);
      }
    }
  }

  getAll() {
    if(!this.todos) {
      return this.localDB.allDocs({ include_docs: true})
      .then((docs: { rows: []}) => {
        this.todos = docs.rows.map((row: { doc?: any}) => row.doc);
        this.localDB.changes({ live: true, since: 'now', include_docs: true }).on('change', this.onDatabaseChange);
        return this.todos;
      })
    } else {
      return Promise.resolve(this.todos);
    }
  }

  save(todo: Todo) {
    return this.localDB.post(todo);
  }

  update(todo: Todo) {
    return this.localDB.put(todo);
  }

  remove(todo: Todo) {
    return this.localDB.remove(todo);
  }
}
