import { Component, Input, OnInit } from '@angular/core';
import { DrugDetail } from 'src/assets/models/drug-models';

@Component({
  selector: 'drug-card',
  templateUrl: './drug-card.component.html',
  styleUrls: ['./drug-card.component.scss'],
})
export class DrugCardComponent implements OnInit {
  @Input()
  drug: DrugDetail | undefined;

  @Input()
  fullWidth = false;

  constructor() {}

  ngOnInit(): void {}

  prettify(val: string) : string {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }
}
