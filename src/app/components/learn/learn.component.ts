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
  learnDrugs: DrugDetail[] = [];
  drugIndex = 0;

  constructor(private drugService: DrugService) {}

  ngOnInit(): void {}

  reset() {
    this.learnDrugs = [];
    this.drugIndex = 0;
  }

  checkSelection(selectionValue: string) {
    switch (selectionValue) {
      case 'BY_CATEGORY':
        break;
      case 'BY_NAME':
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
}
