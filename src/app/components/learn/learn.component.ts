import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DrugService } from 'src/app/services/drug.service';
import { DrugDetail } from 'src/assets/models/drug-models';
import { CategoryDialogComponent } from '../common/category-dialog/category-dialog.component';
import { MetadataCategorySelection } from '../common/category-selector/category-selector.component';
import { DrugDialogComponent } from '../common/drug-dialog/drug-dialog.component';

export enum LearnSelection {
  BY_NAME = 'Learn By Name',
  X_BY_CATEGORY = 'Learn By Category',
  RANDOM = 'Random Drug',
}

@Component({
  selector: 'app-learn',
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent implements OnInit {
  learnDrugs: DrugDetail[] = [];
  drugIndex = 0;
  //Alphabet Stuff
  alphabetLearning = false;
  alphabetDrugMap: Map<string, string[]>;
  panelOpenState = false;

  // Category Stuff
  categoryLearning = false;
  readonly alphabetDrugClassMap: Map<string, string[]>;
  readonly alphabetFormulationMap: Map<string, string[]>;
  readonly alphabetCommonSideEffectsMap: Map<string, string[]>;
  readonly alphabetRareSideEffectsMap: Map<string, string[]>;
  alphabetCategoryMap: Map<string, string[]> | undefined;
  currentCategoryMap: Map<string, string[]> | undefined;

  constructor(private drugService: DrugService, private dialog: MatDialog) {
    this.alphabetDrugMap = this.drugService.getAlphabetDrugMap();
    this.alphabetDrugClassMap = this.drugService.getAlphabetDrugClassMap();
    this.alphabetFormulationMap = this.drugService.getAlphabetFormulationMap();
    this.alphabetCommonSideEffectsMap =
      this.drugService.getAlphabetCommonSideEffectsMap();
    this.alphabetRareSideEffectsMap =
      this.drugService.getAlphabetRareSideEffectsMap();
  }

  ngOnInit(): void {}

  reset() {
    this.alphabetLearning = false;
    this.categoryLearning = false;
    this.alphabetCategoryMap = undefined;
    this.currentCategoryMap = undefined;
    this.learnDrugs = [];
    this.drugIndex = 0;
  }

  checkSelection(selectionValue: string) {
    this.alphabetLearning = false;
    switch (selectionValue) {
      case 'X_BY_CATEGORY':
        this.alphabetLearning = false;
        this.categoryLearning = false;
        break;
      case 'BY_NAME':
        this.alphabetLearning = true;
        this.categoryLearning = false;
        break;
      case 'RANDOM':
        this.selectRandomDrug();
        break;
      default:
        break;
    }
  }

  get currentLearnDrug(): DrugDetail {
    return this.learnDrugs[this.drugIndex];
  }

  selectRandomDrug(count = 0) {
    this.drugIndex += count;
    this.learnDrugs.push(this.drugService.getRandomDrug());
  }

  selectMetadataCategory(category: string) {
    this.categoryLearning = true;
    switch (category) {
      case 'COMMON_SIDE_EFFECTS':
        this.alphabetCategoryMap = this.alphabetCommonSideEffectsMap;
        this.currentCategoryMap = this.drugService.getCommonSideEffectsMap();
        break;
      case 'RARE_SIDE_EFFECTS':
        this.alphabetCategoryMap = this.alphabetRareSideEffectsMap;
        this.currentCategoryMap = this.drugService.getRareSideEffectsMap();
        break;
      case 'DRUG_CLASS':
        this.alphabetCategoryMap = this.alphabetDrugClassMap;
        this.currentCategoryMap = this.drugService.getDrugClassMap();
        break;
      case 'FORMULATION':
        this.alphabetCategoryMap = this.alphabetFormulationMap;
        this.currentCategoryMap = this.drugService.getFormulationMap();
        break;
    }
  }

  getDrugNamesByLetter(letter: string): string[] | undefined {
    return this.alphabetDrugMap.get(letter);
  }

  getCategoryNamesByLetter(letter: string): string[] | undefined {
    return this.alphabetCategoryMap?.get(letter);
  }

  openDrugDialog(drugKey: string) {
    const drug: DrugDetail = this.drugService.getDrugRecord()[drugKey];
    const dialogRef = this.dialog.open(DrugDialogComponent, { data: drug });

    dialogRef.afterClosed().subscribe(() => {
      this.drugIndex++;
      this.learnDrugs.push(drug);
    });
  }

  openCategoryDialog(categoryKey: string) {
    const drugKeys: string[] | undefined =
      this.currentCategoryMap?.get(categoryKey);
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      data: {
        categoryKey,
        drugKeys,
        drugRecord: this.drugService.getDrugRecord()
      }
    });

    dialogRef.afterClosed().subscribe((data: DrugDetail[]) => {
      this.drugIndex += data.length;;
      this.learnDrugs.concat(data);
    });
  }
}
