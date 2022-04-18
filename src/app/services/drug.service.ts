import { Injectable } from '@angular/core';
import { drugCSV } from 'src/assets/data/drugs';
import { DrugDetail } from 'src/assets/models/drug-models';

@Injectable({
  providedIn: 'root',
})
export class DrugService {
  private readonly CSV_COLUMN_SPLIT_REGEX = /,(?=(?:(?:[^\"]*"){2})*[^\"]*$)/;
  private readonly COMMA_SPACE_SPLIT_REGEX = /\s*,\s*/;
  private readonly BLACKBOX_WARNING_SPLIT_REGEX = /(BW:)/;
  private readonly SEMICOLON_SPACE_SPLIT_REGEX = /;/;

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
    for (let row of rowSplit) {
      const colSplit: string[] = row.split(this.CSV_COLUMN_SPLIT_REGEX);
      const key = colSplit[0];
      this.addDrug(key, colSplit);
    }

    console.log(this.drugRecord);
  }

  private addDrug(key: string, colSplit: string[]): void {
    if (!this.drugRecord.hasOwnProperty(key)) {
      this.drugRecord[key] = { generic: key, details: [] };
    }

    const { contraindication, blackBoxWarning } =
      this.parseContraindicationBlackBoxWarning(colSplit[6]);

    this.drugRecord[key].details.push({
      brand: this.trimSplitColumn(colSplit[1]),
      drugClass: this.lowerCaseTrimSplitColumn(colSplit[2]),
      formulation: this.lowerCaseTrimSplitColumn(colSplit[3]),
      commonSideEfects: this.lowerCaseTrimSplitColumn(colSplit[4]),
      rareSideEffects: this.lowerCaseTrimSplitColumn(colSplit[5]),
      contraindication: contraindication,
      blackBoxWarning: blackBoxWarning,
    });
  }

  private trimReplace(s: string): string {
    return s.replace('"', '').trim();
  }

  private trimSplitColumn(colString: string): string[] {
    return this.trimReplace(colString).split(this.COMMA_SPACE_SPLIT_REGEX);
  }

  private lowerCaseTrimSplitColumn(colString: string): string[] {
    return this.trimSplitColumn(colString.toLowerCase());
  }

  /**
   *
   * @param val string column of the CSV that contains prefix with CI and BW
   * @returns string array of contraindication warnings
   */
  private parseContraindicationBlackBoxWarning(val: string) {
    const bwSplit: string[] = this.trimReplace(val).split(
      this.BLACKBOX_WARNING_SPLIT_REGEX
    );

    let b: string[] = [];
    let c: string[] = [];
    if (bwSplit[0].startsWith('CI')) {
      this.processCIString(bwSplit[0], c);
      if (bwSplit.length === 3) {
        this.processBWString(bwSplit[2], b);
      } else {
        b.push('none');
      }
    } else if (bwSplit.length === 3) {
      this.processBWString(bwSplit[2], b);
    } else {
      b.push('none');
      c.push('none');
    }
    return {
      contraindication: c,
      blackBoxWarning: b,
    };
  }

  private processCIString(ci: string, c: string[]): void {
    //TODO: when adding to CI map, check if the values are valid and are equal, or else need to split further
    const ciSplit = this.trimReplace(ci)
      .replace('CI:', '')
      .split(this.SEMICOLON_SPACE_SPLIT_REGEX);
    for (let ciVal of ciSplit) {
      c.push(ciVal.trim());
    }
  }

  private processBWString(bw: string, b: string[]): void {
    //TODO: when adding to BW map, check if the values are valid and are equal, or else need to split further
    const bwSplit = this.trimReplace(bw).split(
      this.SEMICOLON_SPACE_SPLIT_REGEX
    );
    for (let bwVal of bwSplit) {
      b.push(bwVal.trim());
    }
  }
}
