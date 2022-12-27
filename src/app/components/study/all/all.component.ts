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
    let drug: Drug = this.drugsService.getDrugs()[drugKey];
    const dialogRef = this.dialog.open(DrugLearnDialogComponent, {
      data: drug,
    });

    dialogRef.afterClosed().subscribe(() => {});
  }
}
