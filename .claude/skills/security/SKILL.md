---
name: security
description: Authentication and authorization patterns. Use when implementing auth checks, protecting routes, handling sessions, or managing user access control.
---

- Upon session creation, also fetch `accesses` so that we know up front which pages will this user be able to go, without further `Request`s to the server. At least for authorization
- These `accesses` would get stored as _user attributes_
- **Authentication checks must be explicit in each protected route** - never use middleware or layout-level auth validation
- Each protected route should call `require_auth()` or `get_current_user()` directly in its loader/action

```ts
// Each protected route does its own auth check
export async function loader({ request }: LoaderArgs) {
  const { user } = await require_auth(request) // Explicit auth check
  // Route-specific logic with user.accesses
}
```

### Resources

[react-router session and cookies](https://reactrouter.com/explanation/sessions-and-cookies)
[middleware authentication best practices](https://pilcrowonpaper.com/blog/middleware-auth)
[oauth guide](https://pilcrowonpaper.com/blog/oauth-guide)

