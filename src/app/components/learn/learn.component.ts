import { Component, OnInit } from '@angular/core';
import { DrugService } from 'src/app/services/drug.service';
import { DrugDetail } from 'src/assets/models/drug-models';
import { CategorySelection } from '../common/category-selector/category-selector.component';

@Component({
  selector: 'app-learn',
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent implements OnInit {
  selection: CategorySelection | undefined;
  learnDrugs: DrugDetail[] = [];
  drugIndex = 0;

  constructor(private drugService: DrugService) {}

  ngOnInit(): void {
    this.drugService.printAll();
  }
  
  reset() {
    this.selection = undefined;
    this.learnDrugs = [];
    this.drugIndex = 0;
  }

  checkSelection(selectionValue: CategorySelection) {
    this.selection = selectionValue;
    if(this.selection === CategorySelection.RANDOM) {
      this.learnDrugs.push(this.drugService.getRandomDrug());
    }
  }

  get currentLearnDrug(): DrugDetail {
    return this.learnDrugs[this.drugIndex];
  }

  getNextDrug() {
    if(this.selection === CategorySelection.RANDOM) {
      this.learnDrugs.push(this.drugService.getRandomDrug());
      this.drugIndex++;
    }
  }
}
