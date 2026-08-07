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
        Set goals. Make constraints. Talk. Plan<br /><br />
        <span class="glow-text">That's it.</span><br /><br />
      </p>

      <h2 class="text-lg font-semibold text-gray-200 mb-3">Key Principles</h2>
      <ul class="space-y-2 text-gray-300">
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Use a constrained LLM in combination with your goals
          to plan and move forwards.
        </li>
        <li class="flex gap-2"><span class="text-gray-500">•</span>When in doubt, go outside.</li>
      </ul>

      <br /><br />

      <p class="text-gray-300 mb-6">
        <span class="glow-text">Clarity</span> exists to help you get unstuck. Hopefully it helps.
        If it doesn't, please let us know how we can improve.<br /><br />
        <i
          >This is open source software. You can
          <a href="https://github.com/firebeacon/Clarity" target="_blank" rel="noopener noreferrer"
            >help</a
          >
          move it towards something even better.</i
        >
      </p>
    </div>
  `,
})
export class GsSolutionComponent {}
