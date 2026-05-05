import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HomePage } from './home-page';

const TEST_CONTENT = 'Test main content';

@Component({
  selector: 'starter-test-host',
  standalone: true,
  imports: [HomePage],
  template: `
    <starter-home-page>
      <section content>{{ testContent }}</section>
    </starter-home-page>
  `,
})
class TestHostComponent {
  testContent = TEST_CONTENT;
}

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('input bindings', () => {
    it('should bind heroBannerHeading to GoabHeroBanner heading', () => {
      const expected = 'Test Heading';

      fixture.componentRef.setInput('heroBannerHeading', expected);
      fixture.detectChanges();

      const heroBanner = fixture.debugElement.query(
        By.directive(GoabHeroBanner)
      );
      expect(heroBanner.componentInstance.heading).toEqual(expected);
    });

    it('should bind heroBannerBackgroundUrl to GoabHeroBanner backgroundUrl', () => {
      const expected = 'https://example.com/image.jpg';

      fixture.componentRef.setInput('heroBannerBackgroundUrl', expected);
      fixture.detectChanges();

      const heroBanner = fixture.debugElement.query(
        By.directive(GoabHeroBanner)
      );
      expect(heroBanner.componentInstance.backgroundUrl).toEqual(expected);
    });

    it('should bind heroBannerMaxContentWidth to GoabHeroBanner maxContentWidth', () => {
      const expected = '800px';

      fixture.componentRef.setInput('heroBannerMaxContentWidth', expected);
      fixture.detectChanges();

      const heroBanner = fixture.debugElement.query(
        By.directive(GoabHeroBanner)
      );
      expect(heroBanner.componentInstance.maxContentWidth).toEqual(expected);
    });

    it('should bind heroBannerBackgroundColor to GoabHeroBanner backgroundColor', () => {
      const expected = '#0070c4';

      fixture.componentRef.setInput('heroBannerBackgroundColor', expected);
      fixture.detectChanges();

      const heroBanner = fixture.debugElement.query(
        By.directive(GoabHeroBanner)
      );
      expect(heroBanner.componentInstance.backgroundColor).toEqual(expected);
    });

    it('should bind heroBannerTextColor to GoabHeroBanner textColor', () => {
      const expected = '#ffffff';

      fixture.componentRef.setInput('heroBannerTextColor', expected);
      fixture.detectChanges();

      const heroBanner = fixture.debugElement.query(
        By.directive(GoabHeroBanner)
      );
      expect(heroBanner.componentInstance.textColor).toEqual(expected);
    });

    it('should bind heroBannerTestId to GoabHeroBanner testId', () => {
      const expected = 'home-hero-banner';

      fixture.componentRef.setInput('heroBannerTestId', expected);
      fixture.detectChanges();

      const heroBanner = fixture.debugElement.query(
        By.directive(GoabHeroBanner)
      );
      expect(heroBanner.componentInstance.testId).toEqual(expected);
    });
  });
});

describe('HomePage content projection', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
  });

  it('should project content into main element', () => {
    const content = hostFixture.debugElement.query(By.css('section[content]'));
    expect(content).toBeTruthy();
    expect(content.nativeElement.textContent).toBe(TEST_CONTENT);
  });
});

