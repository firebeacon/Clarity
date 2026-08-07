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

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavHeaderComponent } from './nav-header.component';

const CARDS = [
  {
    route: '/getting-started',
    title: 'Getting Started',
    description: 'What is this and how do I use it?',
    icon: 'GettingStarted.png',
  },
  {
    route: '/chat',
    title: 'Chat',
    description: 'Start or continue a conversation.',
    icon: 'Chat.png',
  },
  {
    route: '/analytics',
    title: 'Analytics',
    description: 'Insights and data from your conversations.',
    icon: 'Analytics.png',
  },
  {
    route: '/planner',
    title: 'Planner',
    description: 'Plan your days with a calendar and task list.',
    icon: 'Analytics.png',
  },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NavHeaderComponent],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col">
      <app-nav-header />
      <div class="flex flex-1 overflow-hidden">
        <div class="w-80 bg-gray-800 border-r border-gray-700 flex flex-col items-center pt-8">
          <img src="CapyBase.png" alt="CapyBase" class="w-[138px] h-[138px]" />
        </div>
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
            @for (card of cards; track card.route) {
              <a
                [routerLink]="card.route"
                class="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-500 rounded-xl p-6 flex flex-col gap-4 cursor-pointer transition-colors no-underline"
              >
                <img [src]="card.icon" class="w-[150px] h-[150px]" />
                <div>
                  <div class="text-gray-100 font-medium mb-1">{{ card.title }}</div>
                  <div class="text-gray-400 text-sm">{{ card.description }}</div>
                </div>
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  cards = CARDS;
}
