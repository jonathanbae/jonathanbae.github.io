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

export interface Drug {
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
  'ICARE-Cardiology' = 'ICARE-Cardiology',
  'ICARE-ENDO' = 'ICARE-ENDO',
  'ICARE-Gen Med II' = 'ICARE-Gen Med II',
  'ICARE-GENMED 1' = 'ICARE-GENMED 1',
  'ICARE-ID' = 'ICARE-ID',
  'ICARE-NeuroPsych' = 'ICARE-NeuroPsych',
  'ICARE-Onc' = 'ICARE-Onc',
  'ICARE-RENAL' = 'ICARE-RENAL',
  'ICARE-SPECIAL POPS' = 'ICARE-SPECIAL POPS',
  'Nonprescription Products' = 'Nonprescription Products',
}
