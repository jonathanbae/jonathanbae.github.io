import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DrugsService } from 'src/app/services/drugs.service';
import { Course, Drug } from 'src/assets/models/drug-models';
import { DrugLearnDialogComponent } from '../drug-learn-dialog/drug-learn-dialog.component';

interface CourseDescription {
  percentage: string;
  drugs: string;
  info: string;
}

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit {
  courseMap: Map<Course, string[]> = new Map<Course, string[]>();
  selectedCourse: Course | undefined;

  descriptionData: CourseDescription[] = [
    {
      percentage: 'Old Content: 30-35%',
      drugs: `<ul>
    <li>Nonprescription Products</li>
    <li>
      ICARE Modules:
      <ul>
        <li>General Medicine I</li>
        <li>Renal</li>
        <li>Cardiovascular</li>
        <li>Infections Diseases</li>
        <li>Endocrine</li>
        <li>Hematology/Oncology</li>
      </ul>
    </li>
  </ul>
`,
      info: `<ul>
      <li>Brand Name</li>
      <li>Generic Name</li>
      <li>Phamacologic Class**</li>
    </ul>
`,
    },
    {
      percentage: 'New Content: 65-70%',
      drugs: `<ul>
    <li>
      ICARE Modules:
      <ul>
        <li>Neuro/Psychiatry</li>
        <li>General Medicine II</li>
        <li>Special Populations</li>
      </ul>
    </li>
  </ul>
`,
      info: `<ul>
      <li>Brand name</li>
      <li>Generic name</li>
      <li>Pharmacologic class**</li>
      <li>Route of administration</li>
      <li>Most common/severe adverse effects</li>
      <li>Contraindications (includes pregnancy and drug interactions)</li>
      <li>Boxed warnings</li>
      <li>Precautions</li>
      <li>Counseling points</li>
    </ul>
`,
    },
  ];

  displayedColumns: string[] = ['percentage', 'drugs', 'info'];
  showCourseDescription = true;
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

  toggleCourseDescription() {
    this.showCourseDescription = !this.showCourseDescription;
  }
}
