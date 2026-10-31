import { familyWords } from '../content/games/family';
export const familyPhotos: Record<string, string> = Object.fromEntries(familyWords.map(word => [word[0], import.meta.env.BASE_URL + 'family/' + word[0] + '.webp']));
export function FamilyPicture({ id }: { id: string }) {
  const word = familyWords.find(word => word[0] === id);
  return word ? <span className="beginner-picture-wrap">
    <img className="family-picture profession-photo" src={familyPhotos[id]} alt={`Иллюстрация: ${word[2]}`} width={768} height={768} decoding="async" />
    {id.startsWith('who') && <span className="beginner-picture-question" aria-hidden="true">?</span>}
  </span> : null;
}
