import * as v from "valibot";
import { get_date } from "$lib/date";
import { ForceDateSchema } from "$lib/server/force_date";
import { normalize_input, get_errors } from "$lib/server/form";

const InputSchema = v.object({
  date: ForceDateSchema
});

async function execute(url: URL, form_data: FormData) {
  const input = v.parse(InputSchema, normalize_input(form_data, InputSchema));
  url.searchParams.set("date", get_date(input.date));
  return { redirect_to: url.toString() };
}

export const set_date = {
  execute,
  get_errors: (error: v.ValiError<typeof InputSchema>) => {
    return get_errors<typeof InputSchema>(error);
  }
};
