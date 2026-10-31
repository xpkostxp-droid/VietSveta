import { products } from '../content/advancedProduce';
export function ProducePicture({index}:{index:number}) {
 return <img className="produce-picture" src={import.meta.env.BASE_URL+products[index][0]} alt="" draggable={false}/>;
}
