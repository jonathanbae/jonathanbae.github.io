import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DrugService } from 'src/app/services/drug.service';
import { DrugDetail } from 'src/assets/models/drug-models';
import { DrugDialogComponent } from '../common/drug-dialog/drug-dialog.component';

export enum LearnSelection {
  BY_NAME = 'Select by Name',
  BY_CATEGORY = 'Pick a specific Category',
  RANDOM = 'Random Drug',
}

@Component({
  selector: 'app-learn',
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent implements OnInit {
  alphabetLearning = false;
  learnDrugs: DrugDetail[] = [];
  drugIndex = 0;
  //Alphabet Stuff
  alphabet: string[] = [];
  alphabetDrugMap: Map<string, string[] | undefined> = new Map();
  panelOpenState = false;

  constructor(private drugService: DrugService, private dialog: MatDialog) {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      const drugKeys = Object.keys(this.drugService.getDrugRecord()).filter(
        (d) => d.toLowerCase().startsWith(letter.toLowerCase())
      );
      if (drugKeys.length > 0) {
        this.alphabet.push(String.fromCharCode(65 + i));
        this.alphabetDrugMap.set(
          letter,
          Object.keys(this.drugService.getDrugRecord()).filter((d) =>
            d.toLowerCase().startsWith(letter.toLowerCase())
          )
        );
      }
    }
  }

  ngOnInit(): void {}

  reset() {
    this.alphabetLearning = false;
    this.learnDrugs = [];
    this.drugIndex = 0;
  }

  checkSelection(selectionValue: string) {
    this.alphabetLearning = false;
    switch (selectionValue) {
      case 'BY_CATEGORY':
        break;
      case 'BY_NAME':
        this.alphabetLearning = true;
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

  getNextDrug() {}

  getDrugNamesByLetter(letter: string): string[] | undefined {
    return this.alphabetDrugMap.get(letter);
  }

  openDrugDialog(drugKey: string) {
    const drug: DrugDetail = this.drugService.getDrugRecord()[drugKey];
    const dialogRef = this.dialog.open(DrugDialogComponent, { data: drug });

    dialogRef.afterClosed().subscribe(() => {
      this.drugIndex++;
      this.learnDrugs.push(drug);
    });
  }
}
