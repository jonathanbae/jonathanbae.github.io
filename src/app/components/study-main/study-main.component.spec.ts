import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyMainComponent } from './study-main.component';

describe('StudyMainComponent', () => {
  let component: StudyMainComponent;
  let fixture: ComponentFixture<StudyMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
