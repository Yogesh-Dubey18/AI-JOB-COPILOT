import { PublicNav } from "@/components/layout/public-nav";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div>
      <PublicNav />
      <main className="px-4 py-16">
        <AuthForm mode="login" />
      </main>
    </div>
  );
}
