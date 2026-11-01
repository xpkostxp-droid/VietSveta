import {useLayoutEffect} from 'react';
import {registerScenicDepth,type ScenicDepth} from './scenicDepth';
import '../components/ScenicBackground.css';
export function useScenicDepth(depth:ScenicDepth){useLayoutEffect(()=>registerScenicDepth(depth),[depth]);}
