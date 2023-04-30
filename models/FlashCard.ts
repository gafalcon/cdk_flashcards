export interface FlashCard {
  id: string;
  group: string;
  question: string;
  answer: string;
  two_way: boolean;
  complete: number;
  correct_attempts: number;
  incorrect_attempts: number;
  correct_attempts_two_way?: number;
  incorrect_attempts_two_way?: number;
}
