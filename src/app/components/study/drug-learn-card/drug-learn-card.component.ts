import { Component, Input, OnInit } from '@angular/core';
import { DrugsService } from 'src/app/services/drugs.service';
import { Drug } from 'src/assets/models/drug-models';

@Component({
  selector: 'drug-learn-card',
  templateUrl: './drug-learn-card.component.html',
  styleUrls: ['./drug-learn-card.component.scss'],
})
export class DrugLearnCardComponent implements OnInit {
  @Input()
  drug: Drug = { id: 0, generic: 'This is a test' };

  constructor(private readonly drugsService: DrugsService) {}

  ngOnInit(): void {}

  prettify(val: string): string {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  get isLearned() {
    return (
      this.drugsService.learnedDrugs[this.drug.generic] &&
      this.drugsService.learnedDrugs[this.drug.generic] === true
    );
  }

  get isFlagged() {
    return (
      this.drugsService.flaggedDrugs[this.drug.generic] &&
      this.drugsService.flaggedDrugs[this.drug.generic] === true
    );
  }
}
