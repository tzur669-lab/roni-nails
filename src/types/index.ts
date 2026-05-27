import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "client";

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "change_requested"
  | "completed";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: Timestamp;
  phoneVerified: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  description?: string;
  price?: number;
  active: boolean;
  order: number;
}

export interface ChangeRequest {
  requestedStartTime: Timestamp;
  requestedEndTime: Timestamp;
  requestedAt: Timestamp;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  startTime: Timestamp;
  endTime: Timestamp;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  changeRequest?: ChangeRequest;
  isGuest?: boolean;
}

export type AvailabilityType = "recurring" | "one_time";

export interface AvailabilityRule {
  id: string;
  type: AvailabilityType;
  dayOfWeek?: number; // 0=Sun ... 6=Sat
  date?: Timestamp; // for one_time
  openTime: string; // "09:00"
  closeTime: string; // "19:00"
  isOpen: boolean;
}

export interface BlockedTime {
  id: string;
  date: Timestamp;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  reason?: string;
}

export interface DayOpeningHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  instagramUrl: string;
  googleMapsUrl: string;
  homeImageUrl?: string;
  openingHours: {
    sun: DayOpeningHours;
    mon: DayOpeningHours;
    tue: DayOpeningHours;
    wed: DayOpeningHours;
    thu: DayOpeningHours;
    fri: DayOpeningHours;
    sat: DayOpeningHours;
  };
  galleryImages: string[];
}

export interface PaymentSettings {
  bitQrImageUrl: string;
  bitPhoneNumber: string;
  bitPayUrl?: string;
  payboxPhoneNumber: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  note: string;
  createdAt: Timestamp;
  updatedBy: string;
}

export interface GuestInfo {
  name: string;
  phone: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export type HebrewDayOfWeek =
  | "ראשון"
  | "שני"
  | "שלישי"
  | "רביעי"
  | "חמישי"
  | "שישי"
  | "שבת";
