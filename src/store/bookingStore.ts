import { create } from "zustand";
import type { Service, GuestInfo } from "@/types";

interface BookingState {
  selectedService: Service | null;
  selectedDate: Date | null;
  selectedStartTime: Date | null;
  selectedEndTime: Date | null;
  guestInfo: GuestInfo | null;
  step: 1 | 2 | 3 | 4;

  setService: (s: Service) => void;
  setDate: (d: Date) => void;
  setTimeSlot: (start: Date, end: Date) => void;
  setGuestInfo: (g: GuestInfo) => void;
  setStep: (s: 1 | 2 | 3 | 4) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedService: null,
  selectedDate: null,
  selectedStartTime: null,
  selectedEndTime: null,
  guestInfo: null,
  step: 1,

  setService: (s) => set({ selectedService: s, step: 2 }),
  setDate: (d) => set({ selectedDate: d }),
  setTimeSlot: (start, end) => set({ selectedStartTime: start, selectedEndTime: end, step: 3 }),
  setGuestInfo: (g) => set({ guestInfo: g }),
  setStep: (s) => set({ step: s }),
  reset: () =>
    set({
      selectedService: null,
      selectedDate: null,
      selectedStartTime: null,
      selectedEndTime: null,
      guestInfo: null,
      step: 1,
    }),
}));
