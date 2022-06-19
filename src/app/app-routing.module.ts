import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LearnComponent } from './components/learn/learn.component';
import { PracticeComponent } from './components/practice/practice.component';
import { StudyMainComponent } from './components/study-main/study-main.component';
import { NodeStoneComponent } from './nodestone-components/nodestone.component';

const routes: Routes = [
  {
    path: 'study',
    component: StudyMainComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'learn', component: LearnComponent },
      { path: 'practice', component: PracticeComponent },
    ],
  },

  { path: 'nodestone', component: NodeStoneComponent },
  { path: '', redirectTo: '/study/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
