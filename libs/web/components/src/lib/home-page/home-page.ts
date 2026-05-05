import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomePage as HomePageLayout } from '@starter/ui-components';

@Component({
  selector: 'csa-home-page',
  standalone: true,
  imports: [HomePageLayout],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}

