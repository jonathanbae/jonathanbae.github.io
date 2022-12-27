import { Component, Inject, EventEmitter, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Drug } from 'src/assets/models/drug-models';

@Component({
  selector: 'app-drug-learn-dialog',
  templateUrl: './drug-learn-dialog.component.html',
  styleUrls: ['./drug-learn-dialog.component.scss'],
})
export class DrugLearnDialogComponent implements OnInit {
  flagDrug = new EventEmitter();
  learnedDrug = new EventEmitter();
  clearDrug = new EventEmitter();

  constructor(@Inject(MAT_DIALOG_DATA) public drug: Drug) {}

  ngOnInit(): void {}

  onFlagDrug() {
    this.flagDrug.emit();
  }

  onLearnedDrug() {
    this.learnedDrug.emit();
  }

  onClearDrug() {
    this.clearDrug.emit();
  }
}
