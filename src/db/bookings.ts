import { db } from "./index";

export const TIME_SLOTS = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export interface NewBooking {
  serviceName: string;
  price: number;
  date: string;
  time: string;
  clientName: string;
  telegramUsername?: string;
}

export class SlotTakenError extends Error {}

const getBookedTimesStmt = db.prepare(
  `SELECT time FROM bookings WHERE date = ? AND status = 'confirmed'`
);

export function getFreeSlots(date: string): string[] {
  const booked = new Set(
    (getBookedTimesStmt.all(date) as { time: string }[]).map((r) => r.time)
  );
  return TIME_SLOTS.filter((slot) => !booked.has(slot));
}

const insertBookingStmt = db.prepare(`
  INSERT INTO bookings (service_name, price, date, time, client_name, telegram_username, status)
  VALUES (@serviceName, @price, @date, @time, @clientName, @telegramUsername, 'confirmed')
`);

export function createBooking(booking: NewBooking): number {
  try {
    const info = insertBookingStmt.run({
      serviceName: booking.serviceName,
      price: booking.price,
      date: booking.date,
      time: booking.time,
      clientName: booking.clientName,
      telegramUsername: booking.telegramUsername ?? null,
    });
    return Number(info.lastInsertRowid);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      throw new SlotTakenError(`Slot ${booking.date} ${booking.time} is already booked`);
    }
    throw err;
  }
}
