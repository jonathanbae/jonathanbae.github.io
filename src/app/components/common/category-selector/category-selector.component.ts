import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LearnSelection } from '../../learn/learn.component';

export enum MetadataCategorySelection {
  DRUG_CLASS = 'Drug Class',
  FORMULATION = 'Formulation',
  COMMON_SIDE_EFFECTS = 'Common Side Effects',
  RARE_SIDE_EFFECTS = 'Rare Side Effects',
  // CONTRAINDICATIONS = 'Contraindications',
  // BLACK_BOX_WARNINGS = 'Black Box Warnings',
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
  @Output()
  randomChange = new EventEmitter<number>();

  // Variables for selecting the Category if BY_CATEGORY selected
  readonly MetadataCategorySelection = MetadataCategorySelection;
  metadataCategorySelection: MetadataCategorySelection | undefined;
  @Output()
  metadataCategorySelectionChange = new EventEmitter<MetadataCategorySelection>();

  constructor() {}

  ngOnInit(): void {}

  selectLearn(l: string) {
    this.selection = l as LearnSelection;
    this.selectionChange.emit(this.selection);
  }

  reset() {
    this.selection = undefined;
    this.metadataCategorySelection = undefined;
    this.resetChange.emit('');
  }

  selectAnotherRandom() {
    this.randomChange.emit(1);
  }

  selectCategory(val: MetadataCategorySelection) {
    this.metadataCategorySelection = val;
    this.metadataCategorySelectionChange.emit(val);
  }
}
