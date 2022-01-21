import { Component, OnInit } from '@angular/core';
import { DrugService } from 'src/app/services/drug.service';

@Component({
  selector: 'app-learn',
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.scss'],
})
export class LearnComponent implements OnInit {
  constructor(private drugService: DrugService) {}

  ngOnInit(): void {
    this.drugService.printAll();
  }
}
