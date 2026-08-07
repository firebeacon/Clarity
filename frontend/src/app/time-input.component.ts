// Copyright (C) 2026 Gregory Dott
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-time-input',
  standalone: true,
  template: `
    <div
      class="inline-flex items-center bg-gray-700 rounded border transition-colors"
      [class.border-violet-500]="hourOpen || minuteOpen"
      [class.border-gray-600]="!hourOpen && !minuteOpen"
    >
      <div class="relative">
        <button
          type="button"
          (click)="toggleHour($event)"
          class="text-gray-100 text-sm px-2 py-1.5 w-11 text-center focus:outline-none cursor-pointer hover:bg-white/5 transition-colors rounded-l border-r border-gray-600"
        >
          {{ hour }}
        </button>
        @if (hourOpen) {
          <div
            class="fixed z-[300] bg-gray-800 border border-gray-600 rounded shadow-xl overflow-y-auto w-11"
            [style.top]="hourDropStyle.top"
            [style.left]="hourDropStyle.left"
            style="max-height: 180px"
          >
            @for (h of hours; track h) {
              <button
                type="button"
                (click)="selectHour(h)"
                class="block w-full text-center text-sm py-1 transition-colors"
                [class]="
                  h === hour
                    ? 'text-violet-400 bg-violet-900/30'
                    : 'text-gray-300 hover:bg-gray-700'
                "
              >
                {{ h }}
              </button>
            }
          </div>
        }
      </div>
      <span class="text-gray-500 px-0.5 select-none text-sm shrink-0">:</span>
      <div class="relative">
        <button
          type="button"
          (click)="toggleMinute($event)"
          class="text-gray-100 text-sm px-2 py-1.5 w-11 text-center focus:outline-none cursor-pointer hover:bg-white/5 transition-colors rounded-r"
        >
          {{ minute }}
        </button>
        @if (minuteOpen) {
          <div
            class="fixed z-[300] bg-gray-800 border border-gray-600 rounded shadow-xl overflow-y-auto w-11"
            [style.top]="minDropStyle.top"
            [style.left]="minDropStyle.left"
            style="max-height: 180px"
          >
            @for (m of minutes; track m) {
              <button
                type="button"
                (click)="selectMinute(m)"
                class="block w-full text-center text-sm py-1 transition-colors"
                [class]="
                  m === minute
                    ? 'text-violet-400 bg-violet-900/30'
                    : 'text-gray-300 hover:bg-gray-700'
                "
              >
                {{ m }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class TimeInputComponent implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  @Input() set value(v: string) {
    if (v) {
      const [h, m] = v.split(':');
      this.hour = (h || '09').padStart(2, '0');
      const mNum = parseInt(m || '0', 10);
      this.minute = String((Math.round(mNum / 5) * 5) % 60).padStart(2, '0');
    }
  }
  @Output() valueChange = new EventEmitter<string>();

  hour = '09';
  minute = '00';
  hourOpen = false;
  minuteOpen = false;
  hourDropStyle = { top: '0px', left: '0px' };
  minDropStyle = { top: '0px', left: '0px' };

  readonly hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  readonly minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  private onDocClick = (event: MouseEvent) => {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.hourOpen = false;
      this.minuteOpen = false;
      this.cdr.detectChanges();
    }
  };

  ngOnInit() {
    document.addEventListener('click', this.onDocClick, true);
  }
  ngOnDestroy() {
    document.removeEventListener('click', this.onDocClick, true);
  }

  private dropdownStyle(btn: HTMLElement): { top: string; left: string } {
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= 184 ? rect.bottom + 2 : rect.top - 182;
    return { top: `${top}px`, left: `${rect.left}px` };
  }

  toggleHour(event: MouseEvent) {
    this.hourOpen = !this.hourOpen;
    this.minuteOpen = false;
    if (this.hourOpen) this.hourDropStyle = this.dropdownStyle(event.currentTarget as HTMLElement);
  }

  toggleMinute(event: MouseEvent) {
    this.minuteOpen = !this.minuteOpen;
    this.hourOpen = false;
    if (this.minuteOpen) this.minDropStyle = this.dropdownStyle(event.currentTarget as HTMLElement);
  }

  selectHour(h: string) {
    this.hour = h;
    this.hourOpen = false;
    this.valueChange.emit(`${this.hour}:${this.minute}`);
  }

  selectMinute(m: string) {
    this.minute = m;
    this.minuteOpen = false;
    this.valueChange.emit(`${this.hour}:${this.minute}`);
  }
}
