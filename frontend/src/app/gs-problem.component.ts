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
        LLMs are useful tools, but open-ended chat tends to drift. Without structure, conversations
        wander and it's easy to lose track of what you actually wanted to get done.
      </p>
      <h2 class="text-lg font-semibold text-gray-200 mb-3">Key Issues</h2>
      <ul class="space-y-2 text-gray-300">
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Conversations lose focus without clear goals.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>LLM responses vary wildly without constraints.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Progress is hard to track across sessions.
        </li>
        <li class="flex gap-2">
          <span class="text-gray-500">•</span>Planning is difficult without a structured format.
        </li>
      </ul>
    </div>
  `,
})
export class GsProblemComponent {}
