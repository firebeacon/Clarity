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

import { Component, signal } from '@angular/core';
import { NavHeaderComponent } from './nav-header.component';
import { GsProblemComponent } from './gs-problem.component';
import { GsSolutionComponent } from './gs-solution.component';
import { GsUserGuidesComponent } from './gs-user-guides.component';

type Tab = 'Problem' | 'Solution' | 'User Guide';
const TABS: Tab[] = ['Problem', 'Solution', 'User Guide'];

@Component({
  selector: 'app-getting-started',
  standalone: true,
  imports: [NavHeaderComponent, GsProblemComponent, GsSolutionComponent, GsUserGuidesComponent],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col">
      <app-nav-header title="Getting Started" />
      <div class="flex flex-1 overflow-hidden">
        <div
          class="w-80 bg-gray-800 border-r border-gray-700 flex flex-col items-center pt-8 gap-2"
        >
          <img src="GettingStarted.png" alt="Getting Started" class="w-[138px] h-[138px] mb-4" />
          @for (tab of tabs; track tab) {
            <button
              (click)="activeTab.set(tab)"
              class="w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer"
              [class.bg-gray-700]="activeTab() === tab"
              [class.text-gray-100]="activeTab() === tab"
              [class.text-gray-400]="activeTab() !== tab"
            >
              {{ tab }}
            </button>
          }
        </div>
        <div class="flex-1 overflow-auto">
          @switch (activeTab()) {
            @case ('Problem') {
              <app-gs-problem />
            }
            @case ('Solution') {
              <app-gs-solution />
            }
            @case ('User Guide') {
              <app-gs-user-guides />
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class GettingStartedComponent {
  tabs = TABS;
  activeTab = signal<Tab>(TABS[0]);
}
