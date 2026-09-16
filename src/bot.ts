import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import type { Context } from "telegraf";
import { SERVICES, getServiceById, getServiceName } from "./services";
import { resetState, getState, setState } from "./dialogFlow";
import { getNextWorkingDays } from "./dateUtils";
import { getFreeSlots, createBooking, SlotTakenError } from "./db/bookings";
import { Lang, LANGUAGES, isLang, t } from "./i18n";
import { getLang, setLang } from "./langStore";
import "./db";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set. Copy .env.example to .env and fill it in.");
}

export const bot = new Telegraf(BOT_TOKEN);

function backButton(lang: Lang) {
  return Markup.button.callback(t(lang, "back"), "back");
}

function serviceKeyboard(lang: Lang) {
  const buttons = SERVICES.map((s) =>
    Markup.button.callback(
      `${getServiceName(s, lang)} — €${s.price} (${s.durationMinutes} min)`,
      `service:${s.id}`
    )
  );
  const languageRow = [Markup.button.callback(t(lang, "changeLanguage"), "language")];
  return Markup.inlineKeyboard([...buttons.map((b) => [b]), languageRow]);
}

function dateKeyboard(lang: Lang) {
  const days = getNextWorkingDays(5, lang);
  const buttons = days.map((d) => Markup.button.callback(d.label, `date:${d.iso}`));
  return Markup.inlineKeyboard([...buttons.map((b) => [b]), [backButton(lang)]]);
}

function timeKeyboard(date: string, lang: Lang) {
  const freeSlots = getFreeSlots(date);
  const buttons = freeSlots.map((slot) => Markup.button.callback(slot, `time:${slot}`));
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(buttons.slice(i, i + 4));
  }
  rows.push([backButton(lang)]);
  return { keyboard: Markup.inlineKeyboard(rows), freeSlots };
}

function confirmKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, "confirmYes"), "confirm:yes")],
    [Markup.button.callback(t(lang, "confirmNo"), "confirm:no")],
  ]);
}

function languageKeyboard() {
  return Markup.inlineKeyboard(
    LANGUAGES.map((l) => [Markup.button.callback(l.label, `lang:${l.code}`)])
  );
}

async function renderServiceStep(ctx: Context, lang: Lang) {
  await ctx.editMessageText(t(lang, "chooseService"), serviceKeyboard(lang));
}

async function renderDateStep(ctx: Context, lang: Lang) {
  await ctx.editMessageText(t(lang, "chooseDay"), dateKeyboard(lang));
}

async function renderTimeStep(ctx: Context, date: string, lang: Lang, note?: string) {
  const { keyboard, freeSlots } = timeKeyboard(date, lang);
  if (freeSlots.length === 0) {
    await ctx.editMessageText(
      `${note ? note + "\n\n" : ""}${t(lang, "noSlotsLeft")}`,
      dateKeyboard(lang)
    );
    return;
  }
  const text = note ? `${note}\n\n${t(lang, "chooseTime")}` : t(lang, "chooseTime");
  await ctx.editMessageText(text, keyboard);
}

bot.start(async (ctx) => {
  const lang = getLang(ctx.chat.id);
  resetState(ctx.chat.id);
  await ctx.reply(t(lang, "welcome"), serviceKeyboard(lang));
});

bot.command("language", async (ctx) => {
  const lang = getLang(ctx.chat.id);
  await ctx.reply(t(lang, "chooseLanguage"), languageKeyboard());
});

bot.action("language", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);
  await ctx.answerCbQuery();
  await ctx.editMessageText(t(lang, "chooseLanguage"), languageKeyboard());
});

bot.action(/^lang:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const code = ctx.match[1];
  if (!isLang(code)) {
    await ctx.answerCbQuery();
    return;
  }

  setLang(chatId, code);
  resetState(chatId);
  await ctx.answerCbQuery(t(code, "languageSet"));
  await ctx.editMessageText(t(code, "welcome"), serviceKeyboard(code));
});

bot.action(/^service:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);

  const state = getState(chatId);
  if (!state || state.step !== "service") {
    await ctx.answerCbQuery();
    return;
  }

  const service = getServiceById(ctx.match[1]);
  if (!service) {
    await ctx.answerCbQuery(t(lang, "serviceNotFound"));
    return;
  }

  setState(chatId, { step: "date", service });
  await ctx.answerCbQuery();
  await renderDateStep(ctx, lang);
});

bot.action(/^date:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);

  const state = getState(chatId);
  if (!state || state.step !== "date" || !state.service) {
    await ctx.answerCbQuery();
    return;
  }

  const iso = ctx.match[1];
  const day = getNextWorkingDays(5, lang).find((d) => d.iso === iso);
  if (!day) {
    await ctx.answerCbQuery(t(lang, "dateUnavailable"));
    return;
  }

  setState(chatId, { ...state, step: "time", date: day.iso, dateLabel: day.label });
  await ctx.answerCbQuery();
  await renderTimeStep(ctx, day.iso, lang);
});

bot.action(/^time:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);

  const state = getState(chatId);
  if (!state || state.step !== "time" || !state.service || !state.date) {
    await ctx.answerCbQuery();
    return;
  }

  const time = ctx.match[1];
  const freeSlots = getFreeSlots(state.date);
  if (!freeSlots.includes(time)) {
    await ctx.answerCbQuery(t(lang, "timeTaken"));
    await renderTimeStep(ctx, state.date, lang, t(lang, "timeTakenNote"));
    return;
  }

  setState(chatId, { ...state, step: "name", time });
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    t(lang, "askName", { service: getServiceName(state.service, lang), day: state.dateLabel ?? "", time }),
    Markup.inlineKeyboard([[backButton(lang)]])
  );
});

bot.action("back", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);

  const state = getState(chatId);
  if (!state) {
    await ctx.answerCbQuery();
    return;
  }

  await ctx.answerCbQuery();

  switch (state.step) {
    case "date":
      setState(chatId, { step: "service" });
      await renderServiceStep(ctx, lang);
      break;
    case "time":
      setState(chatId, { step: "date", service: state.service });
      await renderDateStep(ctx, lang);
      break;
    case "name":
      setState(chatId, {
        step: "time",
        service: state.service,
        date: state.date,
        dateLabel: state.dateLabel,
      });
      if (state.date) {
        await renderTimeStep(ctx, state.date, lang);
      }
      break;
    default:
      // No back button on the first step or the confirmation step
      break;
  }
});

bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const lang = getLang(chatId);
  const state = getState(chatId);
  if (!state || state.step !== "name" || !state.service || !state.date || !state.time) {
    return;
  }

  const clientName = ctx.message.text.trim();
  if (!clientName) {
    await ctx.reply(t(lang, "nameEmpty"));
    return;
  }

  setState(chatId, {
    ...state,
    step: "confirm",
    clientName,
    telegramUsername: ctx.from?.username,
  });

  await ctx.reply(
    t(lang, "confirmSummary", {
      service: getServiceName(state.service, lang),
      day: state.dateLabel ?? "",
      time: state.time,
      name: clientName,
      price: state.service.price,
    }),
    confirmKeyboard(lang)
  );
});

bot.action("confirm:yes", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);

  const state = getState(chatId);
  if (
    !state ||
    state.step !== "confirm" ||
    !state.service ||
    !state.date ||
    !state.time ||
    !state.clientName
  ) {
    await ctx.answerCbQuery();
    return;
  }

  try {
    createBooking({
      serviceName: getServiceName(state.service, lang),
      price: state.service.price,
      date: state.date,
      time: state.time,
      clientName: state.clientName,
      telegramUsername: state.telegramUsername,
    });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      await ctx.answerCbQuery(t(lang, "slotTakenToast"));
      setState(chatId, { step: "time", service: state.service, date: state.date, dateLabel: state.dateLabel });
      await renderTimeStep(ctx, state.date, lang, t(lang, "slotTakenNote"));
      return;
    }
    throw err;
  }

  await ctx.answerCbQuery(t(lang, "bookingConfirmedToast"));
  await ctx.editMessageText(
    t(lang, "bookingConfirmedMessage", {
      service: getServiceName(state.service, lang),
      day: state.dateLabel ?? "",
      time: state.time,
      name: state.clientName,
      price: state.service.price,
    })
  );
  resetState(chatId);
});

bot.action("confirm:no", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = getLang(chatId);

  const state = getState(chatId);
  if (!state || state.step !== "confirm") {
    await ctx.answerCbQuery();
    return;
  }

  await ctx.answerCbQuery(t(lang, "bookingCancelledToast"));
  resetState(chatId);
  await ctx.editMessageText(t(lang, "bookingCancelledMessage"), serviceKeyboard(lang));
});

bot.launch(() => {
  console.log("Bot started");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
