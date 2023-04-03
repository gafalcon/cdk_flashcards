import { FlashCard } from "../models/FlashCard";

export class MissingFieldError extends Error {}

export function validateCreateCardBody(arg: any) {
  if (!(arg as FlashCard).group) {
    throw new MissingFieldError("Value for group required!");
  }
  if (!(arg as FlashCard).question) {
    throw new MissingFieldError("Value for question required!");
  }
  if (!(arg as FlashCard).answer) {
    throw new MissingFieldError("Value for answer required");
  }
}
