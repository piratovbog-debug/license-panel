import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDB(env: any): any {
  return drizzle(env.DB, { schema });
}
