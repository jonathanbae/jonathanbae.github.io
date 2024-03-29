import { Injectable } from '@angular/core';
import { dec2022Drugs } from 'src/assets/data/drugs';
import { Drug, DrugInfo, Course } from 'src/assets/models/drug-models';

@Injectable({
  providedIn: 'root',
})
export class DrugsService {
  private readonly CSV_COLUMN_SPLIT_REGEX = /,(?=(?:(?:[^\"]*"){2})*[^\"]*$)/;
  private readonly SEMICOLON_SPACE_SPLIT_REGEX = /\s*;\s*/;
  private readonly LINE_SPACE_SPLIT_REGEX = /\s*\|\s*/;

  // Study Sources
  flaggedDrugs: { [key: string]: boolean } = {};
  learnedDrugs: { [key: string]: boolean } = {};
  // Data
  private readonly dec2022Drugs = dec2022Drugs;
  private readonly course = Course;
  // Drug Data Structures
  private sortedDrugNames: string[];
  private drugRecord: Record<string, Drug> = {};
  private alphabetDrugMap: Map<string, string[]> = new Map<string, string[]>();
  private drugClassMap: Map<string, string[]> = new Map<string, string[]>();
  private alphaDrugClassMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();
  private adminstsMap: Map<string, string[]> = new Map<string, string[]>();
  private alphaAdminstsMap: Map<string, string[]> = new Map<string, string[]>();
  private courseMap: Map<Course, string[]> = new Map<Course, string[]>();

  constructor() {
    for (let val in this.course) {
      const course = <unknown>val;
      this.courseMap.set(<Course>course, []);
    }
    this.convertDrugListCsvToJsonDec2022();

    this.buildAlphabetObjects();

    this.initializeLocallyStoredFlaggedAndLearned();

    this.sortedDrugNames = this.recordKeys(this.drugRecord).sort();

    for (let [key, value] of this.courseMap) {
      this.courseMap.get(key)!.sort();
    }

    for (let [key, value] of this.alphabetDrugMap) {
      this.alphabetDrugMap.get(key)!.sort();
    }
  }

  private initializeLocallyStoredFlaggedAndLearned(): void {
    if (localStorage.getItem('flaggedDrugs') !== null) {
      this.flaggedDrugs = JSON.parse(localStorage.getItem('flaggedDrugs')!);
    }
    if (localStorage.getItem('learnedDrugs') !== null) {
      this.learnedDrugs = JSON.parse(localStorage.getItem('learnedDrugs')!);
    }
  }

  /**
   * Using the dec 2022 Drug constant,
   * split and create the appropriate data structures.
   *
   * If updates to the CSV are made:
   * Manually update the boxed warnings/precautions into new columns in SS
   * just copy/paste this method with different list reference
   *
   * Indices
   * 0: Generic Name
   * 1: Brand Name
   * 2: Associated Course
   * 3: Pharmacologic Class
   * 4: COMMON Route(s) of Administration
   * 5: Contraindications
   * 6: Boxed Warnings And Precautions
   * 7: Precaution
   * 8: Boxed Warnings
   * 9: Clinically Relevant Adverse Reactions (ADRs)
   * 10: Counseling Points
   */
  private convertDrugListCsvToJsonDec2022(): void {
    const rowSplit: string[] = this.dec2022Drugs.split('\n');
    rowSplit.shift();
    let index = 0;
    for (let row of rowSplit) {
      const drugColSplit: string[] = row.split(this.CSV_COLUMN_SPLIT_REGEX);
      const key = drugColSplit[0].replaceAll('|', ',');
      this.createDrugRecord(index, drugColSplit, key);
    }
  }

  /**
   * For future thought - if need to add future columns,
   * just need to add a field and data manipulation.
   */
  private createDrugRecord(
    id: number,
    drugColSplit: string[],
    key: string
  ): void {
    // Add the initial record value.
    this.drugRecord[key] = { generic: key, id, info: {} };

    const course: Course = <Course>(<unknown>drugColSplit[2]);
    // Fields that contain categories:
    // Course (enum), Class, Administration
    this.drugRecord[key].info = {
      brands: this.lineSpaceSplitColumn(drugColSplit[1]),
      course,
      class: this.buildDrugMaps(
        this.semiSplitColumn(drugColSplit[3]),
        key,
        this.drugClassMap
      ),
      administs: this.buildDrugMaps(
        this.semiSplitCategoryColumn(drugColSplit[4]),
        key,
        this.adminstsMap
      ),
      contras: this.semiSplitColumn(drugColSplit[5]),
      warns: drugColSplit[6],
      precautions: this.semiSplitColumn(drugColSplit[7]),
      boxed: this.semiSplitColumn(drugColSplit[8]),
      adrs: this.semiSplitColumn(drugColSplit[9]),
      points: this.semiSplitColumn(drugColSplit[10]),
    };

    this.courseMap.get(course)?.push(key);
  }

  private buildDrugMaps(
    val: string[],
    drugKey: string,
    drugMap: any
  ): string[] {
    for (let v of val) {
      v = v.toLowerCase();
      if (!drugMap.has(v)) {
        drugMap.set(v, [drugKey]);
      } else {
        drugMap.get(v)?.push(drugKey);
      }
    }
    return val;
  }

  /**
   * Build the drug map, drug class, and adminstrations map alphabetically for display purposes
   */
  private buildAlphabetObjects(): void {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);

      // Build drug alphabetic map
      const drugKeys = Object.keys(this.getDrugs()).filter((d) =>
        d.toLowerCase().startsWith(letter.toLowerCase())
      );
      if (drugKeys.length > 0) {
        this.alphabetDrugMap.set(letter, drugKeys);
      }

      // Build Drug Class Alphabetic Map
      const drugClassKeys = Array.from(this.getDrugClassMap().keys()).filter(
        (d) => d.toLowerCase().startsWith(letter.toLowerCase())
      );
      if (drugClassKeys.length > 0) {
        this.alphaDrugClassMap.set(letter, drugClassKeys);
      }
      // Build Administraction Map
      const adminstsKeys = Array.from(this.getAdminstsMap().keys()).filter(
        (d) => d.toLowerCase().startsWith(letter.toLowerCase())
      );
      if (adminstsKeys.length > 0) {
        this.alphaAdminstsMap.set(letter, adminstsKeys);
      }
    }
  }

  public flagDrug(drugKey: string) {
    this.flaggedDrugs[drugKey] = true;
    this.learnedDrugs[drugKey] = false;

    localStorage.setItem('flaggedDrugs', JSON.stringify(this.flaggedDrugs));
    localStorage.setItem('learnedDrugs', JSON.stringify(this.learnedDrugs));
  }

  public learnedDrug(drugKey: string) {
    this.flaggedDrugs[drugKey] = false;
    this.learnedDrugs[drugKey] = true;
    localStorage.setItem('flaggedDrugs', JSON.stringify(this.flaggedDrugs));
    localStorage.setItem('learnedDrugs', JSON.stringify(this.learnedDrugs));
  }

  public clearDrug(drugKey: string) {
    delete this.flaggedDrugs[drugKey];
    delete this.learnedDrugs[drugKey];
    localStorage.setItem('flaggedDrugs', JSON.stringify(this.flaggedDrugs));
    localStorage.setItem('learnedDrugs', JSON.stringify(this.learnedDrugs));
  }

  public getNextAlphabeticDrug(drugKey: string): Drug {
    let index = this.sortedDrugNames.indexOf(drugKey);
    if (index >= this.sortedDrugNames.length - 1) {
      index = -1;
    }
    const nextDrugKey = this.sortedDrugNames[index + 1];
    return this.drugRecord[nextDrugKey];
  }

  public getPreviousAlphabeticDrug(drugKey: string) {
    let index = this.sortedDrugNames.indexOf(drugKey);
    if (index === 0) {
      index = this.sortedDrugNames.length;
    }
    const previousDrugKey = this.sortedDrugNames[index - 1];
    return this.drugRecord[previousDrugKey];
  }

  public getNextCourseDrug(drugKey: string, course: Course | undefined) {
    if (course === undefined) {
      return null;
    }
    const courseList = this.courseMap.get(course);
    let index = courseList!.indexOf(drugKey);
    if (index >= courseList!.length - 1) {
      index = -1;
    }
    const nextDrugKey = courseList![index + 1];
    return this.drugRecord[nextDrugKey];
  }

  public getPreviousCourseDrug(drugKey: string, course: Course | undefined) {
    if (course === undefined) {
      return null;
    }
    const courseList = this.courseMap.get(course);
    let index = courseList!.indexOf(drugKey);
    if (index === 0) {
      index = courseList!.length;
    }
    const previousDrugKey = courseList![index - 1];
    return this.drugRecord[previousDrugKey];
  }

  // =======================
  // GETTER/SETTER Methods
  // =======================
  public getDrugs() {
    return this.drugRecord;
  }

  public getDrugClassMap() {
    return this.drugClassMap;
  }

  public getAdminstsMap() {
    return this.adminstsMap;
  }

  public getAlphabetDrugMap() {
    return this.alphabetDrugMap;
  }

  public getCourseMap() {
    return this.courseMap;
  }

  // =======================
  // Helper Methods
  // =======================
  private trimReplace(s: string): string {
    if (s === undefined) return '';
    return s.replaceAll('"', '').trim();
  }

  private semiSplitColumn(colString: string): string[] {
    if (colString === undefined) return [];
    return this.trimReplace(colString)
      .replaceAll('|', ',')
      .split(this.SEMICOLON_SPACE_SPLIT_REGEX);
  }

  private semiSplitCategoryColumn(colString: string): string[] {
    if (colString === undefined) return [];
    return this.trimReplace(colString)
      .replaceAll('|', ';')
      .replaceAll('/', ';')
      .split(this.SEMICOLON_SPACE_SPLIT_REGEX);
  }

  private lineSpaceSplitColumn(s: string): string[] {
    if (s === undefined) return [];
    return this.trimReplace(s).split(this.LINE_SPACE_SPLIT_REGEX);
  }

  private recordKeys<K extends PropertyKey, T>(object: Record<K, T>) {
    return Object.keys(object) as K[];
  }
}
