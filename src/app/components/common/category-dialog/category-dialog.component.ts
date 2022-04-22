import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DrugDetail } from 'src/assets/models/drug-models';

@Component({
  selector: 'app-category-dialog',
  templateUrl: './category-dialog.component.html',
  styleUrls: ['./category-dialog.component.scss'],
})
export class CategoryDialogComponent implements OnInit {
  learnedDrugs: Set<DrugDetail> = new Set<DrugDetail>();
  categoryKey: string;
  drugKeys: string[];
  drugRecord: Record<string, DrugDetail>;
  drug: DrugDetail | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<CategoryDialogComponent>
  ) {
    this.categoryKey = data.categoryKey;
    this.drugKeys = data.drugKeys;
    this.drugRecord = data.drugRecord;
  }

  ngOnInit() {
    this.dialogRef
      .beforeClosed()
      .subscribe(() => this.dialogRef.close([...this.learnedDrugs]));
  }

  selectDrug(drugKey: string) {
    this.drug = this.drugRecord[drugKey];
    this.learnedDrugs.add(this.drug);
  }

  goBack() {
    this.drug = undefined;
  }

  closeDialog() {
    this.dialogRef.close([...this.learnedDrugs]);
  }
}
