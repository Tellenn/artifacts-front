import { ApiKeyForm } from "@/components/ApiKeyForm";

export const metadata = { title: "Réglages — Artifacts MMO" };

export default function SettingsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="text-xl font-bold">Réglages</h1>
      <ApiKeyForm />
    </main>
  );
}
