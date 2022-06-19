import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-study-main',
  templateUrl: './study-main.component.html',
  styleUrls: ['./study-main.component.scss'],
})
export class StudyMainComponent {
  constructor(private router: Router) {}

  navigateHome() {
    this.router.navigate(['/study/home']);
  }
}
