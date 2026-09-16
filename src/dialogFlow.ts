import { Service } from "./services";

export type Step = "service" | "date" | "time" | "name" | "confirm";

export interface DialogState {
  step: Step;
  service?: Service;
  date?: string; // ISO date, e.g. 2026-09-18
  dateLabel?: string; // human label, e.g. "Tue, 18 September"
  time?: string; // e.g. "14:00"
  clientName?: string;
  telegramUsername?: string;
}

const sessions = new Map<number, DialogState>();

export function getState(chatId: number): DialogState | undefined {
  return sessions.get(chatId);
}

export function setState(chatId: number, state: DialogState): void {
  sessions.set(chatId, state);
}

export function resetState(chatId: number): DialogState {
  const state: DialogState = { step: "service" };
  sessions.set(chatId, state);
  return state;
}

export function clearState(chatId: number): void {
  sessions.delete(chatId);
}
