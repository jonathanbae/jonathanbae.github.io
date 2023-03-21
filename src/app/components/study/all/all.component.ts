import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DrugsService } from 'src/app/services/drugs.service';
import { Drug } from 'src/assets/models/drug-models';
import { DrugLearnDialogComponent } from '../drug-learn-dialog/drug-learn-dialog.component';

@Component({
  selector: 'app-all',
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.scss'],
})
export class AllComponent {
  alphabetDrugMap: Map<string, string[]> = new Map<string, string[]>();
  panelOpenState = false;

  constructor(
    private readonly drugsService: DrugsService,
    private dialog: MatDialog
  ) {
    this.alphabetDrugMap = this.drugsService.getAlphabetDrugMap();
  }

  getDrugNamesByLetter(letter: string): string[] | undefined {
    return this.alphabetDrugMap.get(letter);
  }

  openDrugDialog(drugKey: string) {
    let drugKeyCurrent = drugKey;
    let drug: Drug = this.drugsService.getDrugs()[drugKeyCurrent];
    const dialogRef = this.dialog.open(DrugLearnDialogComponent, {
      data: drug,
    });

    dialogRef.afterClosed().subscribe(() => {});

    dialogRef.componentInstance.flagDrug.subscribe(() => {
      this.drugsService.flagDrug(drugKeyCurrent);
    });

    dialogRef.componentInstance.learnedDrug.subscribe(() => {
      this.drugsService.learnedDrug(drugKeyCurrent);
    });

    dialogRef.componentInstance.clearDrug.subscribe(() => {
      this.drugsService.clearDrug(drugKeyCurrent);
    });

    dialogRef.componentInstance.nextDrug.subscribe(() => {
      const nextDrug = this.drugsService.getNextAlphabeticDrug(drugKeyCurrent);
      dialogRef.componentInstance.drug = nextDrug;
      drugKeyCurrent = nextDrug.generic;
    });

    dialogRef.componentInstance.previousDrug.subscribe(() => {
      const previousDrug = this.drugsService.getPreviousAlphabeticDrug(drugKeyCurrent);
      dialogRef.componentInstance.drug = previousDrug;
      drugKeyCurrent = previousDrug.generic;
    });
  }

  recordEntries<K extends PropertyKey, T>(object: Record<K, T>) {
    return Object.entries(object) as [K, T][];
  }

  isFlagged(drugKey: string): boolean {
    return this.drugsService.flaggedDrugs[drugKey] === true;
  }

  isLearned(drugKey: string): boolean {
    return this.drugsService.learnedDrugs[drugKey] === true;
  }
}
