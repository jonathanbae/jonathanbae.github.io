export interface DrugDetail {
  generic: string;
  details: Detail[];
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
