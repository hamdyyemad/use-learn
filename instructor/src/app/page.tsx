import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">
          Home Page
        </h1>
        <p className="text-muted-foreground text-lg">
          This is a Home page.
        </p>
      </main>
    </div>
  );
}
