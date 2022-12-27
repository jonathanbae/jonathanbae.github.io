import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugLearnDialogComponent } from './drug-learn-dialog.component';

describe('DrugLearnDialogComponent', () => {
  let component: DrugLearnDialogComponent;
  let fixture: ComponentFixture<DrugLearnDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrugLearnDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrugLearnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
