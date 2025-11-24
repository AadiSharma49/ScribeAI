// app/page.tsx  (server component)
import HomePage from "./home/HomePage";
import AuthLanding from "./auth/AuthLanding";
import { cookies } from "next/headers";
import { getUserFromRequest } from "@/lib/auth.server";

export default async function RootPage() {
  try {
    // cookies() may be a Promise in some Next versions / types — await it to be safe
    const cookieStore = await cookies();
    const token = cookieStore.get("sa_session")?.value ?? "";

    // build a cookie header string and pass to helper which accepts Request-like object
    const cookieHeader = token ? `sa_session=${token}` : "";
    const user = await getUserFromRequest({ headers: { cookie: cookieHeader } }).catch(() => null);

    if (user) {
      return <HomePage user={user} />;
    } else {
      return <AuthLanding />;
    }
  } catch (err) {
    // In case something unexpected happens, log (server) and show auth landing
    console.error("RootPage error reading cookies / user:", err);
    return <AuthLanding />;
  }
}
