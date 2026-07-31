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

/**
 * Lists a user's saved recruiter/networking contacts, paginated. A user
 * building a large professional network over time could accumulate
 * hundreds of contacts, so this is capped and paginated at the database
 * level rather than always fetching every contact ever saved.
 *
 * Backward compatible: listContacts(userId) with no options still works
 * and behaves sensibly (returns the first page, default 100 per page).
 */
export async function listContacts(userId: string, options: { page?: number; limit?: number } = {}) {
  const limit = Math.max(1, Math.min(options.limit || 100, 200));
  const page = Math.max(1, options.page || 1);
  return findRecords("contacts", { userId }, { sort: { name: 1 }, limit, skip: (page - 1) * limit });
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
