export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export const SERVICES: Service[] = [
  { id: "haircut", name: "Men's Haircut", price: 30, durationMinutes: 30 },
  { id: "fade", name: "Fade Haircut", price: 30, durationMinutes: 40 },
  { id: "shave", name: "Shave", price: 25, durationMinutes: 20 },
  { id: "beard", name: "Beard & Mustache Trim", price: 20, durationMinutes: 20 },
  { id: "kids", name: "Kids' Haircut", price: 20, durationMinutes: 30 },
  { id: "combo", name: "Haircut + Beard Combo", price: 45, durationMinutes: 50 },
];

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
