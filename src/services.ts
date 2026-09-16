import { Lang } from "./i18n";

export interface Service {
  id: string;
  price: number;
  durationMinutes: number;
  name: Record<Lang, string>;
}

export const SERVICES: Service[] = [
  {
    id: "haircut",
    price: 30,
    durationMinutes: 30,
    name: { en: "Men's Haircut", de: "Herrenhaarschnitt", ru: "Мужская стрижка" },
  },
  {
    id: "fade",
    price: 30,
    durationMinutes: 40,
    name: { en: "Fade Haircut", de: "Fade-Haarschnitt", ru: "Стрижка Фейд" },
  },
  {
    id: "shave",
    price: 25,
    durationMinutes: 20,
    name: { en: "Shave", de: "Rasur", ru: "Бритьё" },
  },
  {
    id: "beard",
    price: 20,
    durationMinutes: 20,
    name: { en: "Beard & Mustache Trim", de: "Bart- und Schnurrbartschnitt", ru: "Стрижка бороды и усов" },
  },
  {
    id: "kids",
    price: 20,
    durationMinutes: 30,
    name: { en: "Kids' Haircut", de: "Kinderhaarschnitt", ru: "Детская стрижка" },
  },
  {
    id: "combo",
    price: 45,
    durationMinutes: 50,
    name: { en: "Haircut + Beard Combo", de: "Haarschnitt + Bart Kombi", ru: "Мужская стрижка + борода (комбо)" },
  },
];

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getServiceName(service: Service, lang: Lang): string {
  return service.name[lang];
}
