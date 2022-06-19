import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  CORSAIR_SKILLS_STRING,
  EXISTING_CORSAIR_TRIOS,
} from 'src/assets/data/nodestone';

export interface Trio {
  mainSkill: string;
  secondSkill: string;
  thirdSkill: string;
}

export interface CountSkillResult {
  updatedSolutionMap: {
    [key: string]: number;
  };
  shouldContinue: boolean;
  atSolution: boolean;
}

export interface SkillColor {
  color: string;
  backgroundColor: string;
}
@Component({
  selector: 'nodestone',
  templateUrl: './nodestone.component.html',
  styleUrls: ['./nodestone.component.scss'],
})
export class NodeStoneComponent {
  skills: string[] = [];
  colorSkills: { [key: string]: string } = {};
  trios: Trio[] = [];

  solutionStorage: Trio[] = [];
  foundSolution = false;

  skillNamesInput = CORSAIR_SKILLS_STRING;
  trioInput = EXISTING_CORSAIR_TRIOS;

  constructor() {
    this.saveSkillNamesInput();
    this.parseTrios();
  }

  /**===================
   * ===================
   * Initialize Section
   * ===================
   * ===================*/
  buildColorSkills() {
    for (let i = 0; i < this.skills.length; i++) {
      const skill = this.skills[i];
      this.colorSkills[skill] = `skill-${i}`;
    }
  }

  parseTrios() {
    const splitTrios = this.trioInput.split('\n');

    this.trios = [];
    for (let trio of splitTrios) {
      const row = trio.split(',');
      this.trios.push({
        mainSkill: row[0],
        secondSkill: row[1],
        thirdSkill: row[2],
      });
    }
  }

  /**===================
   * ===================
   * Solve Section
   * ===================
   * ===================*/
  clear() {
    this.foundSolution = false;
    this.solutionStorage = [];
  }
  solve() {
    console.log('solving');
    for (let i = 0; i < this.trios.length; i++) {
      const trio = this.trios[i];
      const visited: boolean[] = [];
      if (!this.foundSolution) {
        this.solutionStorage.push(trio);
      }
      visited[i] = true;
      const solutionMap = this.countSkill(
        trio,
        this.buildSolutionMap()
      ).updatedSolutionMap;

      this.checkNextTrio(i, trio, visited, solutionMap);
      if (!this.foundSolution) {
        this.solutionStorage.pop();
      }
    }
    console.table(this.solutionStorage);
  }

  checkNextTrio(
    num: number,
    trio: Trio,
    visited: boolean[],
    solutionMap: { [key: string]: number }
  ) {
    for (let j = num + 1; j < this.trios.length; j++) {
      const nextTrio = this.trios[j];
      if (
        this.foundSolution ||
        trio.mainSkill === nextTrio.mainSkill ||
        visited[j]
      ) {
        continue;
      }

      const updates = this.countSkill(nextTrio, solutionMap);
      if (updates.shouldContinue) {
        continue;
      }

      visited[j] = true;
      this.solutionStorage.push(nextTrio);
      this.checkNextTrio(j, nextTrio, visited, updates.updatedSolutionMap);

      if (updates.atSolution) {
        this.foundSolution = true;
        break;
      }

      visited[j] = false;
      if (!this.foundSolution) {
        this.solutionStorage.pop();
      }
    }
  }

  countSkill(
    currTrio: Trio,
    currSolutionMap: { [key: string]: number }
  ): CountSkillResult {
    let shouldContinue = true;
    let atSolution = false;
    const solMap: { [key: string]: number } = { ...currSolutionMap };

    if (
      this.subtractSkillCountsAndContinue(
        solMap,
        currSolutionMap,
        currTrio.mainSkill
      ) &&
      this.subtractSkillCountsAndContinue(
        solMap,
        currSolutionMap,
        currTrio.secondSkill
      ) &&
      this.subtractSkillCountsAndContinue(
        solMap,
        currSolutionMap,
        currTrio.thirdSkill
      )
    ) {
      shouldContinue = false;

      if (Object.values(solMap).every((value) => value === 0)) {
        atSolution = true;
      }
    }

    return { updatedSolutionMap: solMap, shouldContinue, atSolution };
  }

  subtractSkillCountsAndContinue(
    solMap: { [key: string]: number },
    currSolMap: { [key: string]: number },
    key: string
  ) {
    const temp = currSolMap[key] - 1;
    if (temp < 0) {
      return false;
    } else {
      solMap[key] = temp;
      return true;
    }
  }

  buildSolutionMap(): { [key: string]: number } {
    const solutionMap: { [key: string]: number } = {};
    for (let skill of this.skills) {
      solutionMap[skill] = 2;
    }
    return solutionMap;
  }

  /**===================
   * ===================
   * Template Section
   * ===================
   * ===================*/

  setClass(skill: string, mainSkill: boolean) {
    const skillColorName = '' + this.setColor(skill);
    return `trio-skill-row ${skillColorName} ${
      mainSkill ? 'main-trio-skill' : ''
    }`;
  }

  setColor(skill: string) {
    return this.colorSkills[skill];
  }

  buildTemplateContext(skill: string, mainSkill = false) {
    return {
      skill,
      mainSkill,
    };
  }

  /**===================
   * ===================
   * Template Section
   * ===================
   * ===================*/
  saveSkillNamesInput() {
    this.skills = this.skillNamesInput.split('\n');
    this.buildColorSkills();
  }
}
