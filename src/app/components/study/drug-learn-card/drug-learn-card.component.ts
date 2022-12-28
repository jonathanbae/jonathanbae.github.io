import { Component, Input, OnInit } from '@angular/core';
import { Course, Drug } from 'src/assets/models/drug-models';

@Component({
  selector: 'drug-learn-card',
  templateUrl: './drug-learn-card.component.html',
  styleUrls: ['./drug-learn-card.component.scss'],
})
export class DrugLearnCardComponent implements OnInit {
  @Input()
  drug: Drug = { id: 0, generic: 'This is a test' };

  newCourses: Set<Course> = new Set<Course>([
    Course['ICARE-NeuroPsych'],
    Course['ICARE-Gen Med II'],
    Course['ICARE-SPECIAL POPS'],
  ]);

  constructor() {}

  ngOnInit(): void {}

  prettify(val: string): string {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  get isNewContent() {
    return this.newCourses.has(this.drug.info!.course!);
  }
}
