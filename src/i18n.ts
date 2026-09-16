export type Lang = "en" | "de" | "ru";

export const DEFAULT_LANG: Lang = "en";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "🇬🇧 English" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "ru", label: "🇷🇺 Русский" },
];

export function isLang(value: string): value is Lang {
  return value === "en" || value === "de" || value === "ru";
}

interface Dict {
  welcome: string;
  chooseService: string;
  chooseDay: string;
  chooseTime: string;
  serviceNotFound: string;
  dateUnavailable: string;
  timeTaken: string;
  timeTakenNote: string;
  noSlotsLeft: string;
  askName: string;
  nameEmpty: string;
  confirmSummary: string;
  confirmYes: string;
  confirmNo: string;
  bookingConfirmedToast: string;
  bookingConfirmedMessage: string;
  slotTakenToast: string;
  slotTakenNote: string;
  bookingCancelledToast: string;
  bookingCancelledMessage: string;
  back: string;
  changeLanguage: string;
  chooseLanguage: string;
  languageSet: string;
}

const MESSAGES: Record<Lang, Dict> = {
  en: {
    welcome: "Welcome to the barbershop! Choose a service:",
    chooseService: "Choose a service:",
    chooseDay: "Choose a convenient day:",
    chooseTime: "Choose a time:",
    serviceNotFound: "Service not found",
    dateUnavailable: "This date is no longer available",
    timeTaken: "This time is already booked",
    timeTakenNote: "This time slot was just taken.",
    noSlotsLeft: "No free slots left for this day. Please choose another day.",
    askName: "Service: {service}\nDay: {day}\nTime: {time}\n\nPlease type your name:",
    nameEmpty: "Name cannot be empty. Please type your name:",
    confirmSummary:
      "Please check the details:\n\nService: {service}\nDay: {day}\nTime: {time}\nName: {name}\nPrice: €{price}\n\nIs everything correct?",
    confirmYes: "✅ Confirm",
    confirmNo: "❌ Cancel",
    bookingConfirmedToast: "Booking confirmed!",
    bookingConfirmedMessage:
      "✅ Booking confirmed!\n\nService: {service}\nDay: {day}\nTime: {time}\nName: {name}\nPrice: €{price}\n\nWe look forward to seeing you! To book again, send /start",
    slotTakenToast: "This time slot was just taken",
    slotTakenNote: "This time slot was just taken, please choose another.",
    bookingCancelledToast: "Booking cancelled",
    bookingCancelledMessage: "Booking cancelled. Choose a service:",
    back: "🔙 Back",
    changeLanguage: "🌐 Language",
    chooseLanguage: "Choose your language:",
    languageSet: "Language updated",
  },
  de: {
    welcome: "Willkommen im Barbershop! Wählen Sie eine Leistung:",
    chooseService: "Wählen Sie eine Leistung:",
    chooseDay: "Wählen Sie einen passenden Tag:",
    chooseTime: "Wählen Sie eine Uhrzeit:",
    serviceNotFound: "Leistung nicht gefunden",
    dateUnavailable: "Dieses Datum ist nicht mehr verfügbar",
    timeTaken: "Diese Uhrzeit ist bereits vergeben",
    timeTakenNote: "Diese Uhrzeit wurde gerade vergeben.",
    noSlotsLeft:
      "Für diesen Tag sind keine freien Termine mehr verfügbar. Bitte wählen Sie einen anderen Tag.",
    askName: "Leistung: {service}\nTag: {day}\nUhrzeit: {time}\n\nBitte geben Sie Ihren Namen ein:",
    nameEmpty: "Der Name darf nicht leer sein. Bitte geben Sie Ihren Namen ein:",
    confirmSummary:
      "Bitte überprüfen Sie die Angaben:\n\nLeistung: {service}\nTag: {day}\nUhrzeit: {time}\nName: {name}\nPreis: €{price}\n\nIst alles korrekt?",
    confirmYes: "✅ Bestätigen",
    confirmNo: "❌ Abbrechen",
    bookingConfirmedToast: "Buchung bestätigt!",
    bookingConfirmedMessage:
      "✅ Buchung bestätigt!\n\nLeistung: {service}\nTag: {day}\nUhrzeit: {time}\nName: {name}\nPreis: €{price}\n\nWir freuen uns auf Sie! Um erneut zu buchen, senden Sie /start",
    slotTakenToast: "Diese Uhrzeit wurde gerade vergeben",
    slotTakenNote: "Diese Uhrzeit wurde gerade vergeben, bitte wählen Sie eine andere.",
    bookingCancelledToast: "Buchung storniert",
    bookingCancelledMessage: "Buchung storniert. Wählen Sie eine Leistung:",
    back: "🔙 Zurück",
    changeLanguage: "🌐 Sprache",
    chooseLanguage: "Wählen Sie Ihre Sprache:",
    languageSet: "Sprache geändert",
  },
  ru: {
    welcome: "Добро пожаловать в барбершоп! Выберите услугу:",
    chooseService: "Выберите услугу:",
    chooseDay: "Выберите удобный день:",
    chooseTime: "Выберите время:",
    serviceNotFound: "Услуга не найдена",
    dateUnavailable: "Эта дата больше недоступна",
    timeTaken: "Это время уже занято",
    timeTakenNote: "Это время только что заняли.",
    noSlotsLeft: "На этот день свободных слотов не осталось. Выберите другой день.",
    askName: "Услуга: {service}\nДень: {day}\nВремя: {time}\n\nНапишите, пожалуйста, ваше имя:",
    nameEmpty: "Имя не может быть пустым. Напишите, пожалуйста, ваше имя:",
    confirmSummary:
      "Проверьте, всё ли верно:\n\nУслуга: {service}\nДень: {day}\nВремя: {time}\nИмя: {name}\nЦена: €{price}\n\nВсё верно?",
    confirmYes: "✅ Подтвердить",
    confirmNo: "❌ Отменить",
    bookingConfirmedToast: "Запись подтверждена!",
    bookingConfirmedMessage:
      "✅ Запись подтверждена!\n\nУслуга: {service}\nДень: {day}\nВремя: {time}\nИмя: {name}\nЦена: €{price}\n\nЖдём вас в барбершопе! Чтобы записаться ещё раз, отправьте /start",
    slotTakenToast: "Это время только что заняли",
    slotTakenNote: "Это время только что заняли, выберите другое.",
    bookingCancelledToast: "Запись отменена",
    bookingCancelledMessage: "Запись отменена. Выберите услугу:",
    back: "🔙 Назад",
    changeLanguage: "🌐 Язык",
    chooseLanguage: "Выберите язык:",
    languageSet: "Язык изменён",
  },
};

export function t(lang: Lang, key: keyof Dict, vars?: Record<string, string | number>): string {
  let text: string = MESSAGES[lang][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
