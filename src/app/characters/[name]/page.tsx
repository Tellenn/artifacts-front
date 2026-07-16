import { notFound } from "next/navigation";
import { fetchCharacters, fetchObjectives } from "@/lib/api";
import { ArtifactsCharacter } from "@/types/character";
import { CharacterDetail } from "@/components/CharacterDetail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const { name } = await params;
  const [characters, objectives] = await Promise.all([
    fetchCharacters(),
    fetchObjectives().catch(() => ({} as Record<string, string>)),
  ]);
  const character: ArtifactsCharacter | undefined = characters.find(
    (c) => c.name.toLowerCase() === decodeURIComponent(name).toLowerCase()
  );

  if (!character) notFound();

  return (
    <CharacterDetail
      initialCharacter={character}
      objective={objectives[character.name]}
    />
  );
}
