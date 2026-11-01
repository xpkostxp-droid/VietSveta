import {useEffect} from 'react';
import {registerStudyContext,type StudyCategory} from './studyTelemetry';
export function useStudyActivity(category:StudyCategory,topic:string,enabled=true){useEffect(()=>enabled?registerStudyContext(category,topic):undefined,[category,topic,enabled]);}
