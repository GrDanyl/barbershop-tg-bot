import { DEFAULT_LANG, Lang } from "./i18n";

const userLangs = new Map<number, Lang>();

export function getLang(chatId: number): Lang {
  return userLangs.get(chatId) ?? DEFAULT_LANG;
}

export function setLang(chatId: number, lang: Lang): void {
  userLangs.set(chatId, lang);
}
