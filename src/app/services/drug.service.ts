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
  drugList: DrugDetail[] = [];
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

  //alphabet
  private alphabetDrugMap: Map<string, string[]> = new Map();
  private alphabetDrugClassMap: Map<string, string[]> = new Map();
  private alphabetFormulationMap: Map<string, string[]> = new Map();
  private alphabetCommonSideEffectsMap: Map<string, string[]> = new Map();
  private alphabetRareSideEffectsMap: Map<string, string[]> = new Map();

  constructor() {
    this.convertDrugListCSVtoJSON();

    this.buildAlphabetObjects();
  }

  buildAlphabetObjects() {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      //DRUG
      const drugKeys = Object.keys(this.getDrugRecord()).filter((d) =>
        d.toLowerCase().startsWith(letter.toLowerCase())
      );
      if (drugKeys.length > 0) {
        this.alphabetDrugMap.set(letter, drugKeys);
      }

      this.buildAlphabetCategoryMap(
        this.getDrugClassMap(),
        letter,
        this.alphabetDrugClassMap
      );
      this.buildAlphabetCategoryMap(
        this.getFormulationMap(),
        letter,
        this.alphabetFormulationMap
      );
      this.buildAlphabetCategoryMap(
        this.getCommonSideEffectsMap(),
        letter,
        this.alphabetCommonSideEffectsMap
      );
      this.buildAlphabetCategoryMap(
        this.getRareSideEffectsMap(),
        letter,
        this.alphabetRareSideEffectsMap
      );
    }
  }

  buildAlphabetCategoryMap(
    iter: Map<string, string[]>,
    letter: string,
    alphabetMap: Map<string, string[]>
  ) {
    const keys = Array.from(iter.keys()).filter((d) =>
      d.toLowerCase().startsWith(letter.toLowerCase())
    );
    if (keys.length > 0) {
      alphabetMap.set(letter, keys);
    }
  }

  public getDrugRecord(): Record<string, DrugDetail> {
    return this.drugRecord;
  }

  public getAlphabetDrugMap(): Map<string, string[]> {
    return this.alphabetDrugMap;
  }

  public getAlphabetDrugClassMap(): Map<string, string[]> {
    return this.alphabetDrugClassMap;
  }

  public getAlphabetFormulationMap(): Map<string, string[]> {
    return this.alphabetFormulationMap;
  }

  public getAlphabetCommonSideEffectsMap(): Map<string, string[]> {
    return this.alphabetCommonSideEffectsMap;
  }

  public getAlphabetRareSideEffectsMap(): Map<string, string[]> {
    return this.alphabetRareSideEffectsMap;
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

  public get drugListLength() {
    return this.drugList.length;
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
    rowSplit.shift();
    let index = 0;
    for (let row of rowSplit) {
      const colSplit: string[] = row.split(this.CSV_COLUMN_SPLIT_REGEX);
      const key = colSplit[0];
      this.addDrug(key, colSplit, index);

      if (index === 0) {
        this.drugList.push(this.getDrugRecord()[key]);
        index++;
      } else if (this.drugList[index - 1].generic !== key) {
        this.drugList.push(this.getDrugRecord()[key]);
        index++;
      }
    }
  }

  private addDrug(key: string, colSplit: string[], index: number): void {
    if (!this.drugRecord.hasOwnProperty(key)) {
      this.drugRecord[key] = { generic: key, details: [], index };
    }

    const { contraindication, blackBoxWarning } =
      this.parseContraindicationBlackBoxWarning(colSplit[6]);

    this.drugRecord[key].details.push({
      brand: this.trimSplitColumn(colSplit[1]),
      drugClass: this.buildDrugMaps(
        this.lowerCaseTrimSplitColumn(colSplit[2]),
        key,
        this.drugClassMap
      ),
      formulation: this.buildDrugMaps(
        this.lowerCaseTrimSplitColumn(colSplit[3]),
        key,
        this.formulationMap
      ),
      commonSideEffects: this.buildDrugMaps(
        this.lowerCaseTrimSplitColumn(colSplit[4]),
        key,
        this.commonSideEffectsMap
      ),
      rareSideEffects: this.buildDrugMaps(
        this.lowerCaseTrimSplitColumn(colSplit[5]),
        key,
        this.rareSideEffectsMap
      ),
      contraindication: this.buildDrugMaps(
        contraindication,
        key,
        this.contraindicationsMap
      ),
      blackBoxWarning: this.buildDrugMaps(
        blackBoxWarning,
        key,
        this.blackBoxWarningsMap
      ),
    });
  }

  private buildDrugMaps(val: string[], key: string, drugMap: any): string[] {
    for (let v of val) {
      if (!drugMap.has(v)) {
        drugMap.set(v, [key]);
      } else {
        drugMap.get(v)?.push(key);
      }
    }
    return val;
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
      c.push('none');
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

  // Helper Methods
  private trimReplace(s: string): string {
    return s.replaceAll('"', '').trim();
  }

  private trimSplitColumn(colString: string): string[] {
    return this.trimReplace(colString).split(this.COMMA_SPACE_SPLIT_REGEX);
  }

  private lowerCaseTrimSplitColumn(colString: string): string[] {
    return this.trimSplitColumn(colString.toLowerCase());
  }
}
