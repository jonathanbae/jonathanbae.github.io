import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export enum CategorySelection {
  CATEGORY = 'CATEGORY',
  RANDOM = 'RANDOM',
}

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
  selection: CategorySelection | undefined;
  metadataSelection: MetadataCategorySelection | undefined;
  metadataCategorySelections = MetadataCategorySelection;
  @Output()
  selectionChange = new EventEmitter<CategorySelection>();
  @Output()
  resetChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  reset() {
    this.selection = undefined;
    this.metadataSelection = undefined;
    this.resetChange.emit('');
  }

  selectCategory() {
    this.selection = CategorySelection.CATEGORY;
  }

  selectMetadataCategory(value: MetadataCategorySelection) {
    this.metadataSelection = value;
  }

  selectRandom() {
    this.selection = CategorySelection.RANDOM;
    this.selectionChange.emit(this.selection);
  }
}
