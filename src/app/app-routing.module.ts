import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdministrationComponent } from './components/study/administration/administration.component';
import { AllComponent } from './components/study/all/all.component';
import { ClassComponent } from './components/study/class/class.component';
import { CourseComponent } from './components/study/course/course.component';
// import { HomeComponent } from './components/home/home.component';
// import { LearnComponent } from './components/learn/learn.component';
// import { PracticeComponent } from './components/practice/practice.component';
// import { StudyMainComponent } from './components/study-main/study-main.component';
import { StudyComponent } from './components/study/study.component';
import { NodeStoneComponent } from './nodestone-components/nodestone.component';

const routes: Routes = [
  // {
  //   path: 'study',
  //   component: StudyMainComponent,
  //   children: [
  //     { path: 'home', component: HomeComponent },
  //     { path: 'learn', component: LearnComponent },
  //     { path: 'practice', component: PracticeComponent },
  //   ],
  // },
  {
    path: 'study',
    component: StudyComponent,
    children: [
      { path: '', redirectTo: 'all', pathMatch: 'full' },
      { path: 'all', component: AllComponent },
      { path: 'course', component: CourseComponent },
      { path: 'class', component: ClassComponent },
      { path: 'administration', component: AdministrationComponent },
    ],
  },
  { path: 'nodestone', component: NodeStoneComponent },
  { path: '', redirectTo: '/study/all', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
