// Command Pattern для Undo/Redo функционала

export interface Command {
  execute: () => void;
  undo: () => void;
  description: string;
}

export class CommandHistory {
  private past: Command[] = [];
  private future: Command[] = [];
  private maxHistorySize: number;
  
  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }
  
  execute(command: Command): void {
    command.execute();
    this.past.push(command);
    
    // Очищаем future при новом действии
    this.future = [];
    
    // Ограничиваем размер истории
    if (this.past.length > this.maxHistorySize) {
      this.past.shift();
    }
  }
  
  undo(): Command | null {
    const command = this.past.pop();
    if (command) {
      command.undo();
      this.future.push(command);
      return command;
    }
    return null;
  }
  
  redo(): Command | null {
    const command = this.future.pop();
    if (command) {
      command.execute();
      this.past.push(command);
      return command;
    }
    return null;
  }
  
  canUndo(): boolean {
    return this.past.length > 0;
  }
  
  canRedo(): boolean {
    return this.future.length > 0;
  }
  
  clear(): void {
    this.past = [];
    this.future = [];
  }
  
  getHistory(): { past: string[]; future: string[] } {
    return {
      past: this.past.map(cmd => cmd.description),
      future: this.future.map(cmd => cmd.description),
    };
  }
}

// Фабрика команд для различных операций
import type { Phrase, Group } from '../types';

export class AddPhrasesCommand implements Command {
  description: string;
  private addedPhrases: Phrase[];
  private addFn: (phrases: Phrase[]) => void;
  private deleteFn: (ids: string[]) => void;
  
  constructor(
    phrases: Phrase[],
    addFn: (phrases: Phrase[]) => void,
    deleteFn: (ids: string[]) => void
  ) {
    this.addedPhrases = phrases;
    this.addFn = addFn;
    this.deleteFn = deleteFn;
    this.description = `Добавлено фраз: ${phrases.length}`;
  }
  
  execute(): void {
    // Фразы уже добавлены, ничего не делаем
  }
  
  undo(): void {
    const ids = this.addedPhrases.map(p => p.id);
    this.deleteFn(ids);
  }
}

export class DeletePhrasesCommand implements Command {
  description: string;
  private deletedPhrases: Phrase[];
  private addFn: (phrases: Phrase[]) => void;
  
  constructor(
    phrases: Phrase[],
    addFn: (phrases: Phrase[]) => void
  ) {
    this.deletedPhrases = phrases;
    this.addFn = addFn;
    this.description = `Удалено фраз: ${phrases.length}`;
  }
  
  execute(): void {
    // Фразы уже удалены, ничего не делаем
  }
  
  undo(): void {
    this.addFn(this.deletedPhrases);
  }
}

export class UpdatePhraseCommand implements Command {
  description: string;
  private phraseId: string;
  private oldData: Partial<Phrase>;
  private newData: Partial<Phrase>;
  private updateFn: (id: string, updates: Partial<Phrase>) => void;
  
  constructor(
    phraseId: string,
    oldData: Partial<Phrase>,
    newData: Partial<Phrase>,
    updateFn: (id: string, updates: Partial<Phrase>) => void
  ) {
    this.phraseId = phraseId;
    this.oldData = oldData;
    this.newData = newData;
    this.updateFn = updateFn;
    this.description = `Изменена фраза`;
  }
  
  execute(): void {
    // Фраза уже обновлена, ничего не делаем
  }
  
  undo(): void {
    this.updateFn(this.phraseId, this.oldData);
  }
}

export class AddGroupCommand implements Command {
  description: string;
  private group: Group;
  private addFn: (group: Group) => void;
  private deleteFn: (id: string) => void;
  
  constructor(
    group: Group,
    addFn: (group: Group) => void,
    deleteFn: (id: string) => void
  ) {
    this.group = group;
    this.addFn = addFn;
    this.deleteFn = deleteFn;
    this.description = `Создана группа: "${group.name}"`;
  }
  
  execute(): void {
    // Группа уже создана, ничего не делаем
  }
  
  undo(): void {
    this.deleteFn(this.group.id);
  }
}

export class DeleteGroupCommand implements Command {
  description: string;
  private group: Group;
  private addFn: (group: Group) => void;
  
  constructor(
    group: Group,
    addFn: (group: Group) => void
  ) {
    this.group = group;
    this.addFn = addFn;
    this.description = `Удалена группа: "${group.name}"`;
  }
  
  execute(): void {
    // Группа уже удалена, ничего не делаем
  }
  
  undo(): void {
    this.addFn(this.group);
  }
}

export class UpdateGroupCommand implements Command {
  description: string;
  private groupId: string;
  private oldData: Partial<Group>;
  private newData: Partial<Group>;
  private updateFn: (id: string, updates: Partial<Group>) => void;
  
  constructor(
    groupId: string,
    oldData: Partial<Group>,
    newData: Partial<Group>,
    updateFn: (id: string, updates: Partial<Group>) => void
  ) {
    this.groupId = groupId;
    this.oldData = oldData;
    this.newData = newData;
    this.updateFn = updateFn;
    this.description = `Изменена группа`;
  }
  
  execute(): void {
    // Группа уже обновлена, ничего не делаем
  }
  
  undo(): void {
    this.updateFn(this.groupId, this.oldData);
  }
}
