import {
  BlackBoxWarning,
  Contraindication,
  DrugClass,
  DrugDetail,
  Formulation,
  SideEffect,
} from '../models/drug-models';

export const drugList: Record<string, DrugDetail> = {
  copyPaste: {
    generic: 'copypaste',
    brand: '',
    drugClass: DrugClass.VIRAL_DNA,
    formulation: [],
    commonSideEfects: [],
    rareSideEffects: [],
    contraindication: [],
    blackBoxWarning: [],
  },
  acyclovir: {
    generic: 'Acyclovir',
    brand: 'Zovirax',
    drugClass: DrugClass.VIRAL_DNA,
    formulation: [
      Formulation.CAPSULE,
      Formulation.SUSPENSION,
      Formulation.TABLET,
    ],
    commonSideEfects: [SideEffect.MALAISE],
    rareSideEffects: [
      SideEffect.SEVERE_HYPERSENSITIVITY,
      SideEffect.RENAL_FAILURE,
      SideEffect.TTP,
    ],
    contraindication: [Contraindication.NONE],
    blackBoxWarning: [BlackBoxWarning.NONE],
  },
};
