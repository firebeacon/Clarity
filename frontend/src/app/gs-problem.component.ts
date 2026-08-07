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
  selector: 'app-gs-problem',
  standalone: true,
  template: `
    <div class="p-10 max-w-3xl">
      <h1 class="text-2xl font-bold text-gray-100 mb-4">Problem</h1>
      <p class="text-gray-300 mb-6">
        Attention is fractured. The capacity to focus has been eroded.<br /><br />
        <span class="glow-text">Without action slippage is inevitable.</span><br /><br />
      </p>
      <h2 class="text-lg font-semibold text-gray-200 mb-3">Key Issues</h2>
      <ul class="space-y-2 text-gray-300">
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Attention spans are rapidly degrading.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Simple planning tasks are hard to sustain.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Jumbled minds in isolation struggle to plan.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>This trajectory ends in death and sadness.
        </li>
      </ul>
    </div>
  `,
})
export class GsProblemComponent {}
