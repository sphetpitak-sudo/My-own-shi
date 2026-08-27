import LandingHero from "@/components/LandingHero";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  return (
    <main>
      <LandingHero />
      <div className="relative z-10 -mt-6">
        <AuthForm />
      </div>
    </main>
  );
}
