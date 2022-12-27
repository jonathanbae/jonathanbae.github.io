import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Drug } from 'src/assets/models/drug-models';

@Component({
  selector: 'app-drug-learn-dialog',
  templateUrl: './drug-learn-dialog.component.html',
  styleUrls: ['./drug-learn-dialog.component.scss'],
})
export class DrugLearnDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public drug: Drug) {}

  ngOnInit(): void {}
}
