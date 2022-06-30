import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DrugDetail } from 'src/assets/models/drug-models';

@Component({
  selector: 'app-drug-dialog',
  templateUrl: './drug-dialog.component.html',
  styleUrls: ['./drug-dialog.component.scss'],
})
export class DrugDialogComponent implements OnInit {
  onNext = new EventEmitter();
  onPrevious = new EventEmitter();

  constructor(@Inject(MAT_DIALOG_DATA) public drug: DrugDetail) {}

  ngOnInit(): void {}

  onNextClick() {
    this.onNext.emit();
  }

  onPreviousClick() {
    this.onPrevious.emit();
  }
}
