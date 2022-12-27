import { Component, OnInit } from '@angular/core';
import { DrugsService } from 'src/app/services/drugs.service';

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.scss']
})
export class StudyComponent implements OnInit {

  constructor(private readonly drugsService: DrugsService) { }

  ngOnInit(): void {
  }

}
