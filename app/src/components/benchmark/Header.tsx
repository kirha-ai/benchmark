import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        <a href="https://kirha.com" target="_blank" rel="noopener noreferrer">
          <img
            src="/logo-name.svg"
            alt="Kirha"
            className="h-10 sm:h-15 -ml-2 sm:-ml-3.5"
          />
        </a>
        <Button asChild className="rounded-full">
          <a
            href="https://app.kirha.com/auth/register"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sign up
          </a>
        </Button>
      </div>
    </header>
  );
}
