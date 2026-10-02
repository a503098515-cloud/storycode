// Validation schemas for todo inputs. They run at the API boundary before
// any database operation — invalid shapes never reach the database.
import { z } from "zod";

export const CreateSubmission = z.object({
  levelId: z.string().min(1, "Level ID is required"),//USER ID
  codeSubmitted: z.string().min(1, "Submitted code cannot be empty").max(10000, "Code is too long"),// not be empty and max 10,000 characters
  isPassed: z.boolean().optional().default(false),//the user pass
});

export type CreateSubmissionInput = z.infer<typeof CreateSubmission>;