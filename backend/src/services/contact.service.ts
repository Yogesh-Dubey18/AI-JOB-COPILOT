import { ApiError } from "../utils/ApiError.js";
import { createRecord, deleteRecord, findRecordById, findRecords } from "../utils/repository.js";

type ContactInput = {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
};

export async function createContact(userId: string, input: ContactInput) {
  if (!input.name) {
    throw new ApiError(400, "Contact name is required");
  }
  return createRecord("contacts", {
    userId,
    name: input.name,
    company: input.company || "",
    role: input.role || "",
    email: input.email || "",
    phone: input.phone || "",
    linkedinUrl: input.linkedinUrl || "",
    notes: input.notes || ""
  });
}

export async function listContacts(userId: string) {
  return findRecords("contacts", { userId }, { sort: { name: 1 } });
}

export async function getContact(userId: string, id: string) {
  const contact = await findRecordById("contacts", id);
  if (!contact || String(contact.userId) !== userId) {
    throw new ApiError(404, "Contact not found");
  }
  return contact;
}

export async function deleteContact(userId: string, id: string) {
  await getContact(userId, id);
  return deleteRecord("contacts", id);
}
