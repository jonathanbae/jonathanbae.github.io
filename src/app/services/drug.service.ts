import { Injectable } from '@angular/core';
import { drugCSV } from 'src/assets/data/drugs';
import { DrugDetail } from 'src/assets/models/drug-models';

@Injectable({
  providedIn: 'root',
})
export class DrugService {
  private drugRecord: Record<string, DrugDetail> = {};
  private readonly drugCSV = drugCSV;
  private drugClassMap: Map<string, string[]> = new Map<string, string[]>();
  private formulationMap: Map<string, string[]> = new Map<string, string[]>();
  private commonSideEffectsMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();
  private rareSideEffectsMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();
  private contraindicationsMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();
  private blackBoxWarningsMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();

  constructor() {
    this.convertDrugListCSVtoJSON();
    // this.buildDrugCategoryMaps();
  }

  // private buildDrugCategoryMaps() {
  //   Object.entries(this.drugRecord).forEach((drug) => {
  //     const drugKey = drug[0];
  //     const drugDetail = drug[1];

  //     const drugClass = drugDetail.drugClass;
  //     if (!this.drugClassMap.has(drugClass)) {
  //       this.drugClassMap.set(drugClass, [drugKey]);
  //     } else {
  //       this.drugClassMap.get(drugClass)?.push(drugKey);
  //     }

  //     drugDetail.formulation.forEach((formulation: Formulation) => {
  //       const val = formulation.valueOf();
  //       if (!this.formulationMap.has(val)) {
  //         this.formulationMap.set(val, [drugKey]);
  //       } else {
  //         this.formulationMap.get(val)?.push(drugKey);
  //       }
  //     });

  //     drugDetail.commonSideEfects.forEach((commonSideEfect: SideEffect) => {
  //       const val = commonSideEfect.valueOf();
  //       if (!this.commonSideEffectsMap.has(val)) {
  //         this.commonSideEffectsMap.set(val, [drugKey]);
  //       } else {
  //         this.commonSideEffectsMap.get(val)?.push(drugKey);
  //       }
  //     });

  //     drugDetail.rareSideEffects.forEach((rareSideEffect: SideEffect) => {
  //       const val = rareSideEffect.valueOf();
  //       if (!this.rareSideEffectsMap.has(val)) {
  //         this.rareSideEffectsMap.set(val, [drugKey]);
  //       } else {
  //         this.rareSideEffectsMap.get(val)?.push(drugKey);
  //       }
  //     });

  //     drugDetail.contraindication.forEach(
  //       (contraindication: Contraindication) => {
  //         const val = contraindication.valueOf();
  //         if (!this.contraindicationsMap.has(val)) {
  //           this.contraindicationsMap.set(val, [drugKey]);
  //         } else {
  //           this.contraindicationsMap.get(val)?.push(drugKey);
  //         }
  //       }
  //     );

  //     drugDetail.blackBoxWarning.forEach((blackBoxWarning: BlackBoxWarning) => {
  //       const val = blackBoxWarning.valueOf();
  //       if (!this.blackBoxWarningsMap.has(val)) {
  //         this.blackBoxWarningsMap.set(val, [drugKey]);
  //       } else {
  //         this.blackBoxWarningsMap.get(val)?.push(drugKey);
  //       }
  //     });
  //   });
  // }

  public getDrugRecord(): Record<string, DrugDetail> {
    return this.drugRecord;
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

  public getRandomDrug(): DrugDetail {
    const keys = Object.keys(this.drugRecord);

    return this.drugRecord[keys[(keys.length * Math.random()) << 0]];
  }

  /**
   * Takes in the drugCSV and builds the drugRecord JSON Object
   *
   * Indices
   * 0: Generic
   * 1: Brand
   * 2: Drug Class
   * 3: Formulation
   * 4: Side Effects (Common)
   * 5: Side Effects (Rare but Serious)
   * 6: Contraindications/Black Box Warnings
   */
  private convertDrugListCSVtoJSON(): void {
    const rowSplit: string[] = this.drugCSV.split('\n');
    let i = 1;
    for (; i < rowSplit.length; i++) {
      const colSplit: string[] = rowSplit[i].split(
        /,(?=(?:(?:[^\"]*"){2})*[^\"]*$)/
      );
      const key = colSplit[0];

      if (!this.drugRecord.hasOwnProperty(key)) {
        this.drugRecord[key] = { generic: key, details: [] };
      }

      this.drugRecord[key].details.push({
        brand: colSplit[1],
        drugClass: colSplit[2],
        formulation: [colSplit[3]],
        commonSideEfects: [colSplit[4]],
        rareSideEffects: [colSplit[5]],
        contraindication: this.parseContraindication(colSplit[6]),
        blackBoxWarning: this.parseBlackBoxWarning(colSplit[6]),
      });
    }

    console.log(this.drugRecord);
  }

  /**
   *
   * @param val string column of the CSV that contains prefix with CI
   * @returns string array of contraindication warnings
   */
  private parseContraindication(val: string): string[] {
    return [];
  }

  /**
   *
   * @param val string column of the CSV that contains prefix with BW
   * @returns string array of blackbox warnings
   */
  private parseBlackBoxWarning(val: string): string[] {
    return [];
  }
}
