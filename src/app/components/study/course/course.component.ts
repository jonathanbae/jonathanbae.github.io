import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DrugsService } from 'src/app/services/drugs.service';
import { Course, Drug } from 'src/assets/models/drug-models';
import { DrugLearnDialogComponent } from '../drug-learn-dialog/drug-learn-dialog.component';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit {
  courseMap: Map<Course, string[]> = new Map<Course, string[]>();
  selectedCourse: Course | undefined;

  constructor(
    private readonly drugsService: DrugsService,
    private dialog: MatDialog
  ) {
    this.courseMap = this.drugsService.getCourseMap();
  }

  ngOnInit(): void {}

  selectCourse(course: Course) {
    this.selectedCourse = course;
  }

  getDrugNamesByCourse(course: Course): string[] {
    return this.courseMap.get(course)!;
  }

  openDrugDialog(drugKey: string) {
    let drug: Drug = this.drugsService.getDrugs()[drugKey];
    const dialogRef = this.dialog.open(DrugLearnDialogComponent, {
      data: drug,
    });

    dialogRef.afterClosed().subscribe(() => {});
  }
}
