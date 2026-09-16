import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import type { Context } from "telegraf";
import { SERVICES, getServiceById } from "./services";
import { DialogState, resetState, getState, setState } from "./dialogFlow";
import { getNextWorkingDays } from "./dateUtils";
import { getFreeSlots, createBooking, SlotTakenError } from "./db/bookings";
import "./db";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set. Copy .env.example to .env and fill it in.");
}

export const bot = new Telegraf(BOT_TOKEN);

const BACK_BUTTON = Markup.button.callback("🔙 Back", "back");

function serviceKeyboard() {
  const buttons = SERVICES.map((s) =>
    Markup.button.callback(`${s.name} — €${s.price} (${s.durationMinutes} min)`, `service:${s.id}`)
  );
  return Markup.inlineKeyboard(buttons, { columns: 1 });
}

function dateKeyboard() {
  const days = getNextWorkingDays(5);
  const buttons = days.map((d) => Markup.button.callback(d.label, `date:${d.iso}`));
  return Markup.inlineKeyboard([...buttons.map((b) => [b]), [BACK_BUTTON]]);
}

function timeKeyboard(date: string) {
  const freeSlots = getFreeSlots(date);
  const buttons = freeSlots.map((slot) => Markup.button.callback(slot, `time:${slot}`));
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(buttons.slice(i, i + 4));
  }
  rows.push([BACK_BUTTON]);
  return { keyboard: Markup.inlineKeyboard(rows), freeSlots };
}

function confirmKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✅ Confirm", "confirm:yes")],
    [Markup.button.callback("❌ Cancel", "confirm:no")],
  ]);
}

async function renderServiceStep(ctx: Context) {
  await ctx.editMessageText("Choose a service:", serviceKeyboard());
}

async function renderDateStep(ctx: Context) {
  await ctx.editMessageText("Choose a convenient day:", dateKeyboard());
}

async function renderTimeStep(ctx: Context, date: string, note?: string) {
  const { keyboard, freeSlots } = timeKeyboard(date);
  const text = note ? `${note}\n\nChoose a time:` : "Choose a time:";
  if (freeSlots.length === 0) {
    await ctx.editMessageText(
      `${note ? note + "\n\n" : ""}No free slots left for this day. Please choose another day.`,
      dateKeyboard()
    );
    return;
  }
  await ctx.editMessageText(text, keyboard);
}

bot.start(async (ctx) => {
  resetState(ctx.chat.id);
  await ctx.reply("Welcome to the barbershop! Choose a service:", serviceKeyboard());
});

bot.action(/^service:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const state = getState(chatId);
  if (!state || state.step !== "service") {
    await ctx.answerCbQuery();
    return;
  }

  const service = getServiceById(ctx.match[1]);
  if (!service) {
    await ctx.answerCbQuery("Service not found");
    return;
  }

  setState(chatId, { step: "date", service });
  await ctx.answerCbQuery();
  await renderDateStep(ctx);
});

bot.action(/^date:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const state = getState(chatId);
  if (!state || state.step !== "date" || !state.service) {
    await ctx.answerCbQuery();
    return;
  }

  const iso = ctx.match[1];
  const day = getNextWorkingDays(5).find((d) => d.iso === iso);
  if (!day) {
    await ctx.answerCbQuery("This date is no longer available");
    return;
  }

  setState(chatId, { ...state, step: "time", date: day.iso, dateLabel: day.label });
  await ctx.answerCbQuery();
  await renderTimeStep(ctx, day.iso);
});

bot.action(/^time:(.+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const state = getState(chatId);
  if (!state || state.step !== "time" || !state.service || !state.date) {
    await ctx.answerCbQuery();
    return;
  }

  const time = ctx.match[1];
  const freeSlots = getFreeSlots(state.date);
  if (!freeSlots.includes(time)) {
    await ctx.answerCbQuery("This time is already booked");
    await renderTimeStep(ctx, state.date, "This time slot was just taken.");
    return;
  }

  setState(chatId, { ...state, step: "name", time });
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `Service: ${state.service.name}\nDay: ${state.dateLabel}\nTime: ${time}\n\nPlease type your name:`,
    Markup.inlineKeyboard([[BACK_BUTTON]])
  );
});

bot.action("back", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const state = getState(chatId);
  if (!state) {
    await ctx.answerCbQuery();
    return;
  }

  await ctx.answerCbQuery();

  switch (state.step) {
    case "date":
      setState(chatId, { step: "service" });
      await renderServiceStep(ctx);
      break;
    case "time":
      setState(chatId, { step: "date", service: state.service });
      await renderDateStep(ctx);
      break;
    case "name":
      setState(chatId, {
        step: "time",
        service: state.service,
        date: state.date,
        dateLabel: state.dateLabel,
      });
      if (state.date) {
        await renderTimeStep(ctx, state.date);
      }
      break;
    default:
      // No back button on the first step or the confirmation step
      break;
  }
});

bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const state = getState(chatId);
  if (!state || state.step !== "name" || !state.service || !state.date || !state.time) {
    return;
  }

  const clientName = ctx.message.text.trim();
  if (!clientName) {
    await ctx.reply("Name cannot be empty. Please type your name:");
    return;
  }

  setState(chatId, {
    ...state,
    step: "confirm",
    clientName,
    telegramUsername: ctx.from?.username,
  });

  await ctx.reply(
    `Please check the details:\n\n` +
      `Service: ${state.service.name}\n` +
      `Day: ${state.dateLabel}\n` +
      `Time: ${state.time}\n` +
      `Name: ${clientName}\n` +
      `Price: €${state.service.price}\n\n` +
      `Is everything correct?`,
    confirmKeyboard()
  );
});

bot.action("confirm:yes", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

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
      serviceName: state.service.name,
      price: state.service.price,
      date: state.date,
      time: state.time,
      clientName: state.clientName,
      telegramUsername: state.telegramUsername,
    });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      await ctx.answerCbQuery("This time slot was just taken");
      setState(chatId, { step: "time", service: state.service, date: state.date, dateLabel: state.dateLabel });
      await renderTimeStep(ctx, state.date, "This time slot was just taken, please choose another.");
      return;
    }
    throw err;
  }

  await ctx.answerCbQuery("Booking confirmed!");
  await ctx.editMessageText(
    `✅ Booking confirmed!\n\n` +
      `Service: ${state.service.name}\n` +
      `Day: ${state.dateLabel}\n` +
      `Time: ${state.time}\n` +
      `Name: ${state.clientName}\n` +
      `Price: €${state.service.price}\n\n` +
      `We look forward to seeing you! To book again, send /start`
  );
  resetState(chatId);
});

bot.action("confirm:no", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const state = getState(chatId);
  if (!state || state.step !== "confirm") {
    await ctx.answerCbQuery();
    return;
  }

  await ctx.answerCbQuery("Booking cancelled");
  resetState(chatId);
  await ctx.editMessageText("Booking cancelled. Choose a service:", serviceKeyboard());
});

bot.launch(() => {
  console.log("Bot started");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
