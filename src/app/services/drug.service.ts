import { Injectable } from '@angular/core';
import { drugList } from 'src/assets/data/drugs';
import { BlackBoxWarning, Contraindication, DrugDetail, Formulation, SideEffect } from 'src/assets/models/drug-models';

@Injectable({
  providedIn: 'root',
})
export class DrugService {
  private readonly drugList = drugList;
  private drugClassMap: Map<string, string[]> = new Map<string, string[]>();
  private formulationMap: Map<string, string[]> = new Map<string, string[]>();
  private commonSideEffectsMap: Map<string, string[]> = new Map<string, string[]>();
  private rareSideEffectsMap: Map<string, string[]> = new Map<string, string[]>();
  private contraindicationsMap: Map<string, string[]> = new Map<string, string[]>();
  private blackBoxWarningsMap: Map<string, string[]> = new Map<string, string[]>();

  constructor() {
    this.buildDrugCategoryMaps();
  }

  private buildDrugCategoryMaps() {
    Object.entries(this.drugList).forEach((drug) => {
      const drugKey = drug[0];
      const drugDetail = drug[1];

      const drugClass = drugDetail.drugClass;
      if (!this.drugClassMap.has(drugClass)) {
        this.drugClassMap.set(drugClass, [drugKey]);
      } else {
        this.drugClassMap.get(drugClass)?.push(drugKey);
      }

      drugDetail.formulation.forEach((formulation: Formulation) => {
        const val = formulation.valueOf();
        if (!this.formulationMap.has(val)) {
          this.formulationMap.set(val, [drugKey]);
        } else {
          this.formulationMap.get(val)?.push(drugKey);
        }
      });
      
      drugDetail.commonSideEfects.forEach((commonSideEfect: SideEffect) => {
        const val = commonSideEfect.valueOf();
        if (!this.commonSideEffectsMap.has(val)) {
          this.commonSideEffectsMap.set(val, [drugKey]);
        } else {
          this.commonSideEffectsMap.get(val)?.push(drugKey);
        }
      });

      drugDetail.rareSideEffects.forEach((rareSideEffect: SideEffect) => {
        const val = rareSideEffect.valueOf();
        if (!this.rareSideEffectsMap.has(val)) {
          this.rareSideEffectsMap.set(val, [drugKey]);
        } else {
          this.rareSideEffectsMap.get(val)?.push(drugKey);
        }
      });

      drugDetail.contraindication.forEach((contraindication: Contraindication) => {
        const val = contraindication.valueOf();
        if (!this.contraindicationsMap.has(val)) {
          this.contraindicationsMap.set(val, [drugKey]);
        } else {
          this.contraindicationsMap.get(val)?.push(drugKey);
        }
      });

      drugDetail.blackBoxWarning.forEach((blackBoxWarning: BlackBoxWarning) => {
        const val = blackBoxWarning.valueOf();
        if (!this.blackBoxWarningsMap.has(val)) {
          this.blackBoxWarningsMap.set(val, [drugKey]);
        } else {
          this.blackBoxWarningsMap.get(val)?.push(drugKey);
        }
      });

    });
  }

  public getDrugList(): Record<string, DrugDetail> {
    return this.drugList;
  }

  public getDrugClassMap() {
    return this.drugClassMap;
  }

  public getFormulationMap() {
    return this.formulationMap;
  }

  public getCommonSideEffectsMap() {
    return this.commonSideEffectsMap;
  }

  public getRareSideEffectsMap() {
    return this.rareSideEffectsMap;
  }

  public getContraindicationsMap() {
    return this.contraindicationsMap;
  }

  public getBlackBoxWarningsMap() {
    return this.blackBoxWarningsMap;
  }

  public printAll() {
    console.log(this.getDrugClassMap());
    console.log(this.getFormulationMap());
    console.log(this.getCommonSideEffectsMap());
    console.log(this.getRareSideEffectsMap());
    console.log(this.getContraindicationsMap());
    console.log(this.getBlackBoxWarningsMap());

  }
}
