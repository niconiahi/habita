---
name: data_dalidation
description: Guidelines when using methods that are not type-safe
---

Whenever you execute one of the following commands, you'll always validate it's return value with a _validation schema_ from Valibot

- `localStorage.get()`
- `response.json()`
- `formData.get()`
- `searchParams.get()`
- `cookies().get()`
- `JSON.parse()`

> NOTE

You don't need to validate query interactions, as it's completely type-safe end to end by Drizzle

See the [examples folder](./examples/) for thorough examples of each case:

- [response.json()](./examples/response-json.tsx)
- [formData.get()](./examples/form-data-get.tsx)
- [searchParams.get()](./examples/search-params-get.tsx)
- [cookies().get()](./examples/cookies-get.ts)
- [localStorage.getItem()](./examples/local-storage-get.tsx)
- [JSON.parse()](./examples/json-parse.tsx)
