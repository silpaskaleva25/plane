import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'starter-basic-layout',
  standalone: true,
  imports: [],
  templateUrl: './basic-layout.html',
  styleUrl: './basic-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicLayout {}

