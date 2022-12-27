import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatTableModule} from '@angular/material/table';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LearnComponent } from './components/learn/learn.component';
import { PracticeComponent } from './components/practice/practice.component';
import { CategorySelectorComponent } from './components/common/category-selector/category-selector.component';
import { DrugCardComponent } from './components/common/drug-card/drug-card.component';
import { LearnedDrugListComponent } from './components/learn/learned-drug-list/learned-drug-list.component';
import { DrugDialogComponent } from './components/common/drug-dialog/drug-dialog.component';
import { CategoryDialogComponent } from './components/common/category-dialog/category-dialog.component';
import { NodeStoneComponent } from './nodestone-components/nodestone.component';
import { StudyMainComponent } from './components/study-main/study-main.component';
import { StudyComponent } from './components/study/study.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AllComponent } from './components/study/all/all.component';
import { CourseComponent } from './components/study/course/course.component';
import { ClassComponent } from './components/study/class/class.component';
import { AdministrationComponent } from './components/study/administration/administration.component';
import { DrugLearnDialogComponent } from './components/study/drug-learn-dialog/drug-learn-dialog.component';
import { DrugLearnCardComponent } from './components/study/drug-learn-card/drug-learn-card.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LearnComponent,
    PracticeComponent,
    CategorySelectorComponent,
    DrugCardComponent,
    LearnedDrugListComponent,
    DrugDialogComponent,
    CategoryDialogComponent,
    NodeStoneComponent,
    StudyMainComponent,
    StudyComponent,
    AllComponent,
    CourseComponent,
    ClassComponent,
    AdministrationComponent,
    DrugLearnDialogComponent,
    DrugLearnCardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,

    FlexLayoutModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatExpansionModule,
    MatInputModule,
    MatDialogModule,
    MatIconModule,
    MatExpansionModule,
    MatToolbarModule,
    MatListModule,
    MatSidenavModule,
    MatTableModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
