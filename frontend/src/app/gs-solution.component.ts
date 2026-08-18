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

@Component({
  selector: 'app-gs-solution',
  standalone: true,
  template: `
    <div class="p-10 max-w-3xl">
      <h1 class="text-2xl font-bold text-gray-100 mb-4">Solution</h1>
      <p class="text-gray-300 mb-6">
        Clarity gives your LLM conversations structure and guides the LLM to behave more appropriately (or at least attempts to). 
        Set goals to keep sessions on track, define constraints to shape how the LLM responds, and use the planner to turn conversations into
        concrete next steps.
      </p>

      <h2 class="text-lg font-semibold text-gray-200 mb-3">Key Principles</h2>
      <ul class="space-y-2 text-gray-300">
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Goals anchor conversations to what you actually want
          to achieve.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Constraints can make LLM behaviour more consistent and
          less annoying.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Seeds let you capture and reuse snapshots of conversation state.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>The planner bridges conversations and real tasks.
        </li>
      </ul>

      <p class="text-gray-300 mt-6">
        <i
          >This is open source software. You can
          <a href="https://github.com/firebeacon/Clarity" target="_blank" rel="noopener noreferrer"
            >help</a
          >
          move it towards something better.</i
        >
      </p>
    </div>
  `,
})
export class GsSolutionComponent {}
