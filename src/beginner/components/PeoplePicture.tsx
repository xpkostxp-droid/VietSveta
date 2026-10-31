import { peopleWords } from '../content/games/people';
export const peoplePhotos: Record<string, string> = Object.fromEntries(peopleWords.map(word => [word[0], import.meta.env.BASE_URL + 'people/' + word[0] + '.webp']));
export function PeoplePicture({ id }: { id: string }) {
  const word = peopleWords.find(word => word[0] === id);
  return word ? <img className="family-picture profession-photo" src={peoplePhotos[id]} alt={`Иллюстрация: ${word[2]}`} width={768} height={768} decoding="async" /> : null;
}
