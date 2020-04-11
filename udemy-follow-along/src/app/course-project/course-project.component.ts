import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-course-project',
  templateUrl: './course-project.component.html',
  styleUrls: ['./course-project.component.css']
})
export class CourseProjectComponent implements OnInit {
  loadedFeature = 'recipe';

  constructor() { }

  ngOnInit() {
  }

  onNavigate(feature: string) {
    this.loadedFeature = feature;
  }

}
