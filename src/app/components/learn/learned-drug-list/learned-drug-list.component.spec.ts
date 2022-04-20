import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnedDrugListComponent } from './learned-drug-list.component';

describe('LearnedDrugListComponent', () => {
  let component: LearnedDrugListComponent;
  let fixture: ComponentFixture<LearnedDrugListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LearnedDrugListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnedDrugListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
