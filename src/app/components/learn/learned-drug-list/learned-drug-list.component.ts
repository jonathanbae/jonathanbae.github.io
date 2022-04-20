import { Component, Input, OnInit } from '@angular/core';
import { DrugDetail } from 'src/assets/models/drug-models';

@Component({
  selector: 'learned-drug-list',
  templateUrl: './learned-drug-list.component.html',
  styleUrls: ['./learned-drug-list.component.scss'],
})
export class LearnedDrugListComponent implements OnInit {
  @Input()
  learnedDrugs: DrugDetail[] | undefined;
  constructor() {}

  ngOnInit(): void {}
}
