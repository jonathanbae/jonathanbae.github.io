import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DrugService } from 'src/app/services/drug.service';
import { LearnSelection } from '../../learn/learn.component';

export enum MetadataCategorySelection {
  DRUG_CLASS = 'Drug Class',
  FORMULATION = 'Formulation',
  COMMON_SIDE_EFFECTS = 'Common Side Effects',
  RARE_SIDE_EFFECTS = 'Rare Side Effects',
  CONTRAINDICATIONS = 'Contraindications',
  BLACK_BOX_WARNINGS = 'Black Box Warnings',
}

@Component({
  selector: 'app-category-selector',
  templateUrl: './category-selector.component.html',
  styleUrls: ['./category-selector.component.scss'],
})
export class CategorySelectorComponent implements OnInit {
  // Variables for selecting the LearnSelection
  readonly LearnSelection = LearnSelection;
  selection: LearnSelection | undefined;
  @Output()
  selectionChange = new EventEmitter<LearnSelection>();
  @Output()
  resetChange = new EventEmitter<string>();

  // Variables for selecting the Category if BY_CATEGORY selected
  metadataSelection: MetadataCategorySelection | undefined;
  
  constructor(private drugService: DrugService) {}

  ngOnInit(): void {}

  selectLearn(l: string) {
    this.selection = l as LearnSelection;
    console.log(this.selection);
  }

  reset() {
    this.selection = undefined;
    this.metadataSelection = undefined;
    this.resetChange.emit('');
  }

  selectRandom() {
    this.selection = LearnSelection.RANDOM;
    this.selectionChange.emit(this.selection);
  }

}
