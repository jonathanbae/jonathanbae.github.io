import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugLearnCardComponent } from './drug-learn-card.component';

describe('DrugLearnCardComponent', () => {
  let component: DrugLearnCardComponent;
  let fixture: ComponentFixture<DrugLearnCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrugLearnCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrugLearnCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
