import { travelWords } from '../content/games/travel';
export const travelPhotos: Record<string, string> = {
  'au': import.meta.env.BASE_URL + 'countries/au.webp',
  'us': import.meta.env.BASE_URL + 'countries/us.webp',
  'es': import.meta.env.BASE_URL + 'countries/es.webp',
  'it': import.meta.env.BASE_URL + 'countries/it.webp',
  'gb': import.meta.env.BASE_URL + 'countries/gb.webp',
  'de': import.meta.env.BASE_URL + 'countries/de.webp',
  'fr': import.meta.env.BASE_URL + 'countries/fr.webp',
  'th': import.meta.env.BASE_URL + 'countries/th.webp',
  'kh': import.meta.env.BASE_URL + 'countries/kh.webp',
  'la': import.meta.env.BASE_URL + 'countries/la.webp',
  'jp': import.meta.env.BASE_URL + 'countries/jp.webp',
  'kr': import.meta.env.BASE_URL + 'countries/kr.webp',
  'cn': import.meta.env.BASE_URL + 'countries/cn.webp',
  'ru': import.meta.env.BASE_URL + 'countries/ru.webp',
  'vn': import.meta.env.BASE_URL + 'countries/vn.webp',
  'asia': import.meta.env.BASE_URL + 'travel/asia.webp',
  'europe': import.meta.env.BASE_URL + 'travel/europe.webp',
  'country': import.meta.env.BASE_URL + 'travel/country.webp',
  'city': import.meta.env.BASE_URL + 'travel/city.webp',
  'capital': import.meta.env.BASE_URL + 'travel/capital.webp',
  'live': import.meta.env.BASE_URL + 'travel/live.webp',
  'travel': import.meta.env.BASE_URL + 'travel/travel.webp',
  'arrive': import.meta.env.BASE_URL + 'travel/arrive.webp',
  'from': import.meta.env.BASE_URL + 'travel/from.webp',
  'origin': import.meta.env.BASE_URL + 'travel/origin.webp',
  'all': import.meta.env.BASE_URL + 'travel/all.webp',
  'person': import.meta.env.BASE_URL + 'travel/person.webp',
  'which': import.meta.env.BASE_URL + 'travel/which.webp',
  'which-country': import.meta.env.BASE_URL + 'travel/which-country.webp',
  'which-city': import.meta.env.BASE_URL + 'travel/which-city.webp',
  'ask-country': import.meta.env.BASE_URL + 'travel/ask-country.webp',
  'ask-city': import.meta.env.BASE_URL + 'travel/ask-city.webp',
};
export function TravelPicture({id}:{id:string}) {
 const word=travelWords.find(w=>w[0]===id);
 const src=travelPhotos[id];
 return src ? <img className="family-picture profession-photo" src={src} alt={`Иллюстрация: ${word?.[2] ?? 'Путешествия'}`} width={768} height={768} decoding="async" /> : null;
}
