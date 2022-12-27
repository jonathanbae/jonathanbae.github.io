import { Component, OnInit } from '@angular/core';
import { DrugsService } from 'src/app/services/drugs.service';
import { Drug } from 'src/assets/models/drug-models';

@Component({
  selector: 'app-all',
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.scss'],
})
export class AllComponent {
  alphabetDrugMap: Map<string, string[]> = new Map<string, string[]>();
  panelOpenState = false;

  constructor(private readonly drugsService: DrugsService) {
    this.alphabetDrugMap = this.drugsService.getAlphabetDrugMap();
  }

  getDrugNamesByLetter(letter: string): string[] | undefined {
    return this.alphabetDrugMap.get(letter);
  }
}
