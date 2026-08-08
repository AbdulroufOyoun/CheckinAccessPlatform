import { ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocaleService } from '../../core/services/locale.service';

@Component({
  selector: 'app-lang-switcher',
  imports: [TranslatePipe],
  templateUrl: './lang-switcher.html',
  styleUrl: './lang-switcher.css',
})
export class LangSwitcher {
  readonly locale = inject(LocaleService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() compact = false;

  async setLang(lang: 'en' | 'ar'): Promise<void> {
    await this.locale.use(lang);
    this.cdr.detectChanges();
  }
}
