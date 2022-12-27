export interface DrugDetail {
  generic: string;
  details: Detail[];
  index: number;
}

export interface Detail {
  brand: string[];
  drugClass: string[];
  formulation: string[];
  commonSideEffects: string[];
  rareSideEffects: string[];
  contraindication: string[];
  blackBoxWarning: string[];
}


export interface  Drug {
  id: number;
  generic: string;
  info?: DrugInfo;
}

export interface DrugInfo {
  brands?: string[];
  course?: Course;
  class?: string[];
  administs?: string[];
  contras?: string[];
  warns?: string;
  boxed?: string[];
  precautions?: string[];
  adrs?: string[];
  points?: string[];
}

export enum Course {
  Cardiology = 'ICARE-Cardiology',
  Endo = 'ICARE-ENDO',
  GenMed2 = 'ICARE-Gen Med II',
  GenMed = 'ICARE-GENMED 1',
  ID = 'ICARE-ID',
  NeuroPsych = 'ICARE-NeuroPsych',
  Onc = 'ICARE-Onc',
  Renal = 'ICARE-RENAL',
  SpecialPOPS = 'ICARE-SPECIAL POPS',
  NonPre = 'Nonprescription Products'
}