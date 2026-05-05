import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Home page layout component with hero banner and content projection.
 *
 * @example
 * ```html
 * <starter-home-page [heroBannerHeading]="'Welcome'">
 *   <p hero-banner-content>Hero description text</p>
 *   <div hero-banner-actions>
 *     <ui-button>Get Started</ui-button>
 *   </div>
 *   <section content>
 *     <h2>Main Content</h2>
 *   </section>
 * </starter-home-page>
 * ```
 *
 * Content Slots:
 * - `[hero-banner-content]` - Content inside the hero banner
 * - `[hero-banner-actions]` - Action buttons in the hero banner
 * - `[content]` - Main page content below the hero
 */
@Component({
  selector: 'starter-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  /** Hero banner heading text */
  heroBannerHeading = input('');

  heroBannerBackgroundUrl = input<string | undefined>(undefined);
  heroBannerMaxContentWidth = input<string | undefined>(undefined);
  heroBannerBackgroundColor = input<string | undefined>(undefined);
  heroBannerTextColor = input<string | undefined>(undefined);
  heroBannerTestId = input<string | undefined>(undefined);
}

