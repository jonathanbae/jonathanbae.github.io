import { Component, Input, OnInit } from '@angular/core';
import { Course, Drug } from 'src/assets/models/drug-models';
import * as _ from 'lodash';

interface RedactedText {
  class: string[];
  administs: string[];
  contras: string[];
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
      boxed: info.boxed!,
      precautions: info.precautions!,
      adrs: info.adrs!,
      points: info.points!,
    };
  }

  isRedacted(field: string, text?: string): boolean {
    if (!text) return false;
    switch (field) {
      case 'class':
        return this.redactedTexts.class.includes(text);
      case 'administs':
        return this.redactedTexts.administs.includes(text);
      case 'contras':
        return this.redactedTexts.contras.includes(text);
      case 'boxed':
        return this.redactedTexts.boxed.includes(text);
      case 'precautions':
        return this.redactedTexts.precautions.includes(text);
      case 'adrs':
        return this.redactedTexts.adrs.includes(text);
      case 'points':
        return this.redactedTexts.points.includes(text);
      default:
        return false;
    }
  }

  removeRedact(field: string, text?: string) {
    if (!text) return;
    switch (field) {
      case 'class':
        this.updateRedactList(this.redactedTexts.class, text);
        break;
      case 'administs':
        this.updateRedactList(this.redactedTexts.administs, text);
        break;
      case 'contras':
        this.updateRedactList(this.redactedTexts.contras, text);
        break;
      case 'boxed':
        this.updateRedactList(this.redactedTexts.boxed, text);
        break;
      case 'precautions':
        this.updateRedactList(this.redactedTexts.precautions, text);
        break;
      case 'adrs':
        this.updateRedactList(this.redactedTexts.adrs, text);
        break;
      case 'points':
        this.updateRedactList(this.redactedTexts.points, text);
        break;
      default:
        return;
    }
  }

  updateRedactList(redacts: string[], text: string) {
    const index = redacts.indexOf(text);
    if (index > -1) {
      redacts.splice(index, 1);
    }
  }
}
