// app/page.tsx
// Root redirect: sends / to /dashboard (if authenticated) or /login.

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}
