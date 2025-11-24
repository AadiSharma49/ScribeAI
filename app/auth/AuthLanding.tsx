// app/auth/AuthLanding.tsx  (server component)
import Link from "next/link";

export default function AuthLanding() {
  return (
    <div className="container py-24 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to ScribeAI</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Sign up or sign in to start recording meetings and generate smart summaries.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          href="/register"
          className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium"
        >
          Register
        </Link>

        <Link
          href="/login"
          className="px-6 py-3 rounded-full border border-muted text-muted-foreground"
        >
          Sign in
        </Link>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
