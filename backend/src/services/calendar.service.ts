import { env } from "../config/env.js";

type CalendarEventInput = {
  title: string;
  description?: string;
  startsAt: string | Date;
  endsAt?: string | Date;
  metadata?: Record<string, any>;
};

export async function createCalendarEvent(input: CalendarEventInput) {
  if (env.CALENDAR_PROVIDER === "google") {
    return {
      provider: "google",
      created: false,
      title: input.title,
      startsAt: input.startsAt,
      note: env.GOOGLE_CALENDAR_CLIENT_ID ? "Google Calendar provider is configured but OAuth event creation is not enabled in this mock-safe foundation." : "Google Calendar credentials are missing."
    };
  }

  return {
    provider: "mock",
    created: false,
    title: input.title,
    startsAt: input.startsAt,
    note: "Calendar provider is not configured. Event was not created."
  };
}

