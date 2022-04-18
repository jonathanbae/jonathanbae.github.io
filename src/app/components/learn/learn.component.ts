import { Component, OnInit } from '@angular/core';
import { DrugService } from 'src/app/services/drug.service';
import { DrugDetail } from 'src/assets/models/drug-models';

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
  selection: LearnSelection | undefined;
  learnDrugs: DrugDetail[] = [];
  drugIndex = 0;

  constructor(private drugService: DrugService) {}

  ngOnInit(): void {}

  reset() {
    this.selection = undefined;
    this.learnDrugs = [];
    this.drugIndex = 0;
  }

  checkSelection(selectionValue: LearnSelection) {
    this.selection = selectionValue;
    if (this.selection === LearnSelection.RANDOM) {
      this.learnDrugs.push(this.drugService.getRandomDrug());
    }
  }

  get currentLearnDrug(): DrugDetail {
    return this.learnDrugs[this.drugIndex];
  }

  getNextDrug() {
    if (this.selection === LearnSelection.RANDOM) {
      this.learnDrugs.push(this.drugService.getRandomDrug());
      this.drugIndex++;
    }
  }
}
