import { Component, Input, OnInit } from '@angular/core';
import { Course, Drug } from 'src/assets/models/drug-models';
import * as _ from "lodash";

interface RedactedText {
  class: string[];
  administs: string[];
  contras: string[];
  warns: string;
  boxed: string[];
  precautions: string[];
  adrs: string[];
  points: string[];
}

@Component({
  selector: 'drug-learn-card',
  templateUrl: './drug-learn-card.component.html',
  styleUrls: ['./drug-learn-card.component.scss'],
})
export class DrugLearnCardComponent implements OnInit {
  @Input()
  drug: Drug = { id: 0, generic: 'This is a test' };

  redactedTexts: RedactedText = {
    class: [],
    administs: [],
    contras: [],
    warns: '',
    boxed: [],
    precautions: [],
    adrs: [],
    points: [],
  };

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

  redactAllFields() {
    const info = _.cloneDeep(this.drug!.info!);
    this.redactedTexts = {
      class: info.class!,
      administs: info.administs!,
      contras: info.contras!,
      warns: info.warns!,
      boxed: info.boxed!,
      precautions: info.precautions!,
      adrs: info.adrs!,
      points: info.points!,
    };
  }

  isRedacted(text: string, field: string): boolean {
    switch (field) {
      case 'class':
        return this.redactedTexts.class.includes(text);
      default:
        return false;
    }
  }

  removeRedact(text: string, field: string) {
    switch (field) {
      case 'class':
        this.updateRedactList(this.redactedTexts.class, text);
        break;
    }
  }

  updateRedactList(redacts: string[], text: string) {
    const index = redacts.indexOf(text);
    if (index > -1) {
      redacts.splice(index, 1);
    }
  }
}
