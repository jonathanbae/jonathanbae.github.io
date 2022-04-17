import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DrugService } from 'src/app/services/drug.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router, private drugService: DrugService) {
    this.drugService.printAll();
  }

  ngOnInit(): void {}

  goLearn() {
    this.router.navigate(['/', 'learn']);
  }

  goPractice() {
    this.router.navigate(['/', 'practice']);
  }
}
