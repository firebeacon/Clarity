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

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TimeInputComponent } from './time-input.component';

describe('TimeInputComponent', () => {
  let fixture: ComponentFixture<TimeInputComponent>;
  let component: TimeInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TimeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('value setter — hour parsing', () => {
    it('sets a two-digit hour correctly', () => {
      component.value = '14:00';
      expect(component.hour).toBe('14');
    });

    it('pads a single-digit hour to two digits', () => {
      component.value = '9:00';
      expect(component.hour).toBe('09');
    });

    it('handles midnight (00)', () => {
      component.value = '00:00';
      expect(component.hour).toBe('00');
    });
  });

  describe('value setter — minute rounding', () => {
    it('keeps an already-rounded minute unchanged', () => {
      component.value = '09:30';
      expect(component.minute).toBe('30');
    });

    it('rounds down to nearest 5 (37 → 35)', () => {
      component.value = '09:37';
      expect(component.minute).toBe('35');
    });

    it('rounds up to nearest 5 (38 → 40)', () => {
      component.value = '09:38';
      expect(component.minute).toBe('40');
    });

    it('wraps 60 back to 00 when rounding up from 58', () => {
      component.value = '09:58';
      expect(component.minute).toBe('00');
    });

    it('rounds 57 down to 55, not up to 60', () => {
      component.value = '09:57';
      expect(component.minute).toBe('55');
    });

    it('pads a rounded single-digit minute to two digits (e.g. 03 → 05)', () => {
      component.value = '09:03';
      expect(component.minute).toBe('05');
    });

    it('defaults minute to 00 when minute part is missing', () => {
      component.value = '09:';
      expect(component.minute).toBe('00');
    });
  });

  describe('selectHour', () => {
    it('updates hour and emits the new value', () => {
      component.minute = '30';
      const emitted: string[] = [];
      component.valueChange.subscribe((v) => emitted.push(v));
      component.selectHour('11');
      expect(component.hour).toBe('11');
      expect(emitted).toEqual(['11:30']);
    });

    it('closes the hour dropdown', () => {
      component.hourOpen = true;
      component.selectHour('10');
      expect(component.hourOpen).toBe(false);
    });
  });

  describe('selectMinute', () => {
    it('updates minute and emits the new value', () => {
      component.hour = '14';
      const emitted: string[] = [];
      component.valueChange.subscribe((v) => emitted.push(v));
      component.selectMinute('45');
      expect(component.minute).toBe('45');
      expect(emitted).toEqual(['14:45']);
    });

    it('closes the minute dropdown', () => {
      component.minuteOpen = true;
      component.selectMinute('15');
      expect(component.minuteOpen).toBe(false);
    });
  });

  describe('hours and minutes arrays', () => {
    it('generates 24 hours from 00 to 23', () => {
      expect(component.hours).toHaveLength(24);
      expect(component.hours[0]).toBe('00');
      expect(component.hours[23]).toBe('23');
    });

    it('generates 12 minutes in steps of 5 from 00 to 55', () => {
      expect(component.minutes).toHaveLength(12);
      expect(component.minutes[0]).toBe('00');
      expect(component.minutes[11]).toBe('55');
    });
  });
});
