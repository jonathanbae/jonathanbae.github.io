import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LearnComponent } from './components/learn/learn.component';
import { PracticeComponent } from './components/practice/practice.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CategorySelectorComponent } from './components/common/category-selector/category-selector.component';
import { DrugCardComponent } from './components/common/drug-card/drug-card.component';
import { LearnedDrugListComponent } from './components/learn/learned-drug-list/learned-drug-list.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LearnComponent,
    PracticeComponent,
    CategorySelectorComponent,
    DrugCardComponent,
    LearnedDrugListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    MatButtonModule,
    MatSelectModule,
    MatCardModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
