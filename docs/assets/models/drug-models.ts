export interface DrugDetail {
  generic: string;
  brand: string;
  drugClass: DrugClass;
  formulation: Formulation[];
  //TODO side effects spreadsheet
  //TODO contraindications
  commonSideEfects: SideEffect[];
  rareSideEffects: SideEffect[];
  contraindication: Contraindication[];
  blackBoxWarning: BlackBoxWarning[];
}

export enum DrugClass {
  VIRAL_DNA = 'Viral DNA Polymerase Inhibitor',
}

export enum Formulation {
  CAPSULE = 'Capsule',
  SUSPENSION = 'Suspension',
  TABLET = 'Tablet',
}

export enum SideEffect {
  MALAISE = 'Malaise',
  SEVERE_HYPERSENSITIVITY = 'Severe hypersensitivity',
  RENAL_FAILURE = 'Renal failure',
  TTP = 'TTP'
}

export enum Contraindication {
  NONE = 'None',
}

export enum BlackBoxWarning {
  NONE = 'None',
}
